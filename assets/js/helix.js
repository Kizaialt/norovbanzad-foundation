// DNA double-helix visual across #helix-hero, #helix-branches, #helix-convergence.
//
// GEOMETRY
// A real double helix is a NARROW object with depth: two backbones rotating about a shared
// axis, connected by short rungs, where each backbone alternately passes in front of and behind
// the other. The earlier version drew the two strands at the two column centres -- 558px apart
// on desktop -- with "rungs" spanning that entire distance as horizontal lines across the
// content. That reads as two vertical rules with page-wide horizontal rules over the text, not
// as DNA. This version puts a properly proportioned helix in the gutter BETWEEN the columns.
//
// Projection (viewer looking down -z, helix axis vertical):
//   theta(y) = phase + 2*pi*y/pitch
//   A: x = cx - R(y)*sin(theta)   depth zA = cos(theta)
//   B: x = cx + R(y)*sin(theta)   depth zB = -cos(theta)
// Backbone B is A rotated by pi, so when one is nearest the viewer the other is furthest.
// A rung's projected width is 2R|sin(theta)|: full at the widest point, collapsing to nothing
// where the strands cross. That collapse is what makes a helix read as a helix.
//
// DEPTH is what the old flat version lacked. Each backbone is emitted as many short segments;
// every segment and rung is sorted by its own depth and appended back-to-front, so nearer
// geometry genuinely paints over farther geometry. Stroke width and opacity are interpolated
// from the same depth value, so the strand thins and fades as it rotates away.
//
// R(y) also carries the narrative and removes a whole class of seam bug: it ramps 0 -> R at the
// top of the branches section and R -> 0 in the convergence section. At radius 0 both backbones
// sit exactly on the axis, vertical -- so "one strand becomes two, then becomes one again"
// happens structurally, and adjoining sections meet at a shared point with matching tangents by
// construction rather than by tuning.
//
// UNITS: each stage's SVG uses a pixel viewBox matching its stage box, so radius, pitch and
// segment length are real pixels. Stages are rebuilt on resize.
//
// No build step, no dependencies. Motion is transform/opacity only; prefers-reduced-motion is
// respected here and in helix.css.

(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var mobileMQ = window.matchMedia('(max-width: 900px)');

  // ---- tuning -----------------------------------------------------------
  var SEG = 14;          // px of backbone per drawn segment (smaller = smoother, more nodes)
  var PITCH = 260;       // px for one full 360deg turn
  var RUNG_EVERY = 44;   // px between rungs along the axis
  var MAX_RADIUS = 30;   // px, capped so the helix always fits the column gutter
  var OP_BACK = 0.20, OP_FRONT = 0.92;
  var W_BACK = 0.75, W_FRONT = 1.7;

  // ---- helpers ----------------------------------------------------------

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(e0, e1, x) {
    var t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }
  function svgEl(tag, attrs) {
    var n = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    return n;
  }
  function buildSvg(w, h, cls) {
    return svgEl('svg', {
      viewBox: '0 0 ' + w + ' ' + h,
      preserveAspectRatio: 'none',
      class: 'helix-svg ' + cls,
      'aria-hidden': 'true',
      focusable: 'false'
    });
  }
  // Map depth (-1 back .. +1 front) to the paint properties that sell three-dimensionality.
  function depthStyle(node, z) {
    var d = (z + 1) / 2;
    node.setAttribute('stroke-width', lerp(W_BACK, W_FRONT, d).toFixed(2));
    node.setAttribute('opacity', lerp(OP_BACK, OP_FRONT, d).toFixed(3));
  }

  // -----------------------------------------------------------------------
  // Core builder: emits depth-sorted backbone segments + rungs into `svg`.
  //
  // cfg: { y0, y1, cx, radiusAt(y), phase, classA, classB, rungClass, withRungs }
  // Returns the rung elements in document order with their y positions, so callers can key
  // timeline items to them.
  // -----------------------------------------------------------------------
  function buildHelix(svg, cfg) {
    var theta = function (y) { return cfg.phase + 2 * Math.PI * (y / PITCH); };
    var xA = function (y) { return cfg.cx - cfg.radiusAt(y) * Math.sin(theta(y)); };
    var xB = function (y) { return cfg.cx + cfg.radiusAt(y) * Math.sin(theta(y)); };

    var nodes = [];  // {el, z}
    var rungs = [];  // {el, y}

    // Backbone segments. Each spans SEG px and overlaps its neighbour by one sample so round
    // caps close the joins without a visible seam.
    var n = Math.max(2, Math.ceil((cfg.y1 - cfg.y0) / SEG));
    for (var side = 0; side < 2; side++) {
      var xf = side === 0 ? xA : xB;
      var cls = side === 0 ? cfg.classA : cfg.classB;
      for (var i = 0; i < n; i++) {
        var ya = cfg.y0 + (cfg.y1 - cfg.y0) * (i / n);
        var yb = cfg.y0 + (cfg.y1 - cfg.y0) * ((i + 1) / n);
        var ym = (ya + yb) / 2;
        // Depth of THIS segment (backbone B is antiphase, hence the sign flip).
        var z = Math.cos(theta(ym)) * (side === 0 ? 1 : -1);
        var seg = svgEl('path', {
          d: 'M ' + xf(ya).toFixed(2) + ' ' + ya.toFixed(2) +
             ' Q ' + xf(ym).toFixed(2) + ' ' + ym.toFixed(2) +
             ' ' + xf(yb).toFixed(2) + ' ' + yb.toFixed(2),
          class: 'helix-seg ' + cls,
          fill: 'none'
        });
        depthStyle(seg, z);
        nodes.push({ el: seg, z: z });
      }
    }

    // Rungs sit on the axis, so their depth is 0 -- they land midway through the stack, which
    // is physically right: half the backbone passes in front of them, half behind.
    if (cfg.withRungs) {
      for (var y = cfg.y0 + RUNG_EVERY; y < cfg.y1; y += RUNG_EVERY) {
        var x1 = xA(y), x2 = xB(y);
        if (Math.abs(x2 - x1) < 1.2) continue; // near a crossing: edge-on, effectively invisible
        var rung = svgEl('line', {
          x1: x1.toFixed(2), y1: y.toFixed(2),
          x2: x2.toFixed(2), y2: y.toFixed(2),
          class: 'helix-rung ' + (cfg.rungClass || ''),
          fill: 'none'
        });
        depthStyle(rung, 0);
        nodes.push({ el: rung, z: 0 });
        rungs.push({ el: rung, y: y });
      }
    }

    // Back-to-front paint order. This is what produces real occlusion: a nearer strand is
    // appended later and therefore paints over the farther one where they cross.
    nodes.sort(function (a, b) { return a.z - b.z; });
    nodes.forEach(function (nd) { svg.appendChild(nd.el); });

    return rungs;
  }

  // -----------------------------------------------------------------------
  // Stage fade-in
  // -----------------------------------------------------------------------
  var stageObserver = null;
  function setupStageFade() {
    var stages = document.querySelectorAll('.helix-stage');
    if (!stages.length) return;
    if (stageObserver) stageObserver.disconnect();
    stageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); stageObserver.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    stages.forEach(function (s) { stageObserver.observe(s); });
  }

  // -----------------------------------------------------------------------
  // Hero -- a single strand, not yet split. Ends dead-centre and vertical so the branches
  // helix (which opens from radius 0) continues it without a seam.
  // -----------------------------------------------------------------------
  function renderHero() {
    var el = document.getElementById('helix-hero');
    if (!el) return;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    el.innerHTML = '';

    var w = Math.round(r.width), h = Math.round(r.height);
    var svg = buildSvg(w, h, 'helix-svg--hero');
    var cx = w / 2;
    var amp = Math.min(34, w * 0.035);

    // Amplitude eases to 0 at both ends: the strand enters and leaves perfectly vertical.
    var pts = [];
    var steps = 60;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var y = -4 + (h + 8) * t;
      var env = smoothstep(0, 0.28, t) * (1 - smoothstep(0.72, 1, t));
      pts.push([cx + amp * env * Math.sin(Math.PI * 2 * 1.25 * t), y]);
    }
    var d = 'M ' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
    for (var k = 1; k < pts.length; k++) {
      var p0 = pts[k - 1], p1 = pts[k];
      d += ' Q ' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + ' ' +
           ((p0[0] + p1[0]) / 2).toFixed(2) + ' ' + ((p0[1] + p1[1]) / 2).toFixed(2);
    }
    d += ' L ' + pts[pts.length - 1][0].toFixed(2) + ' ' + pts[pts.length - 1][1].toFixed(2);

    svg.appendChild(svgEl('path', { d: d, class: 'helix-seg helix-seg--single', fill: 'none' }));
    el.appendChild(svg);
  }

  // -----------------------------------------------------------------------
  // Branches -- the helix proper, living in the gutter between the two columns
  // -----------------------------------------------------------------------
  function measureBranches() {
    var section = document.getElementById('branches');
    var stage = document.getElementById('helix-branches');
    var gold = document.getElementById('branch-norovbanzad');
    var indigo = document.getElementById('branch-banzragch');
    if (!section || !stage || !gold || !indigo) return null;

    // Measured against `stage` -- the element the SVG actually fills. `.helix-stage` is
    // position:absolute; inset:0, which resolves against the section's PADDING box, not its
    // border box, so using the section's rect would offset everything by its vertical padding.
    var sr = stage.getBoundingClientRect();
    if (!sr.width || !sr.height) return null;

    var gr = gold.getBoundingClientRect();
    var ir = indigo.getBoundingClientRect();
    var stacked = ir.top > gr.bottom - 1; // mobile: columns stacked rather than side by side

    var items = Array.prototype.slice.call(section.querySelectorAll('.timeline__item')).map(function (node) {
      var r = node.getBoundingClientRect();
      return {
        el: node,
        y: (r.top + r.height / 2) - sr.top,
        col: node.closest('.branch--gold') ? 'gold' : 'indigo'
      };
    });

    var cx, radius;
    if (stacked) {
      cx = sr.width / 2;
      radius = Math.min(MAX_RADIUS * 0.6, sr.width * 0.05);
    } else {
      // Centre of the gutter, and a radius that always fits inside it.
      cx = ((gr.right + ir.left) / 2) - sr.left;
      radius = Math.min(MAX_RADIUS, Math.max(10, (ir.left - gr.right) * 0.42));
    }

    return { w: Math.round(sr.width), h: Math.round(sr.height), cx: cx, radius: radius, items: items, stacked: stacked };
  }

  var branchObserver = null;
  var keyedRungs = [];              // index-aligned with layout.items
  var activated = new Set();

  function activate(idx) {
    var rec = keyedRungs[idx];
    if (rec && rec.el) rec.el.classList.add('is-active');
  }

  function setupBranchObserver(items) {
    if (branchObserver) branchObserver.disconnect();
    branchObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var idx = e.target.__helixIdx;
        if (e.isIntersecting && !activated.has(idx)) {
          activated.add(idx);
          activate(idx);
          branchObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -10% 0px' });

    items.forEach(function (it, idx) {
      it.el.__helixIdx = idx;
      if (!activated.has(idx)) branchObserver.observe(it.el);
    });
  }

  function renderBranches() {
    var el = document.getElementById('helix-branches');
    if (!el) return;
    var L = measureBranches();
    if (!L) return;
    el.innerHTML = '';

    var svg = buildSvg(L.w, L.h, 'helix-svg--branches' + (L.stacked ? ' helix-svg--stacked' : ''));

    // Radius opens from 0 (continuing the hero's single strand) and stays open at the bottom,
    // where the convergence section picks it up at the same radius.
    var openBy = Math.min(220, L.h * 0.08);
    var radiusAt = function (y) { return L.radius * smoothstep(0, openBy, y); };

    var rungs = buildHelix(svg, {
      y0: -4, y1: L.h + 4, cx: L.cx, radiusAt: radiusAt, phase: 0,
      classA: 'helix-seg--gold', classB: 'helix-seg--indigo',
      rungClass: '', withRungs: true
    });

    el.appendChild(svg);

    // Rungs are laid out on the helix's own rhythm (a helix with irregular rung spacing stops
    // looking like one). Each timeline item is keyed to its nearest rung, so scroll reveals
    // track the content without distorting the geometry.
    //
    // Claiming is exclusive: two items whose midpoints fall near the same rung would otherwise
    // share it, and the second item's reveal would light a rung that is already lit. Items are
    // assigned in order of how good their best match is, so the closest pairings win and no
    // item is left without its own base pair (there are far more rungs than items).
    var claimed = new Set();
    var order = L.items.map(function (it, idx) {
      var best = null, bestD = Infinity;
      rungs.forEach(function (r, ri) {
        var d = Math.abs(r.y - it.y);
        if (d < bestD) { bestD = d; best = ri; }
      });
      return { idx: idx, y: it.y, bestD: bestD };
    }).sort(function (a, b) { return a.bestD - b.bestD; });

    keyedRungs = new Array(L.items.length);
    order.forEach(function (rec) {
      var best = null, bestD = Infinity;
      rungs.forEach(function (r, ri) {
        if (claimed.has(ri)) return;
        var d = Math.abs(r.y - rec.y);
        if (d < bestD) { bestD = d; best = ri; }
      });
      if (best !== null) {
        claimed.add(best);
        rungs[best].el.classList.add('helix-rung--keyed');
        keyedRungs[rec.idx] = rungs[best];
      }
    });

    setupBranchObserver(L.items);
    activated.forEach(activate);
  }

  // -----------------------------------------------------------------------
  // Convergence -- the helix closes back into a single strand
  // -----------------------------------------------------------------------
  function renderConvergence() {
    var el = document.getElementById('helix-convergence');
    if (!el) return;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    el.innerHTML = '';

    var w = Math.round(r.width), h = Math.round(r.height);
    var svg = buildSvg(w, h, 'helix-svg--convergence');

    var B = measureBranches();
    var radius = B ? B.radius : MAX_RADIUS;
    var cx = w / 2;

    // Full radius at the top (matching the branches helix), closing to 0 by ~62% -- after which
    // both backbones lie on the axis and read as one strand running out of the section.
    var closeStart = h * 0.12, closeEnd = h * 0.62;
    var radiusAt = function (y) { return radius * (1 - smoothstep(closeStart, closeEnd, y)); };

    buildHelix(svg, {
      y0: -4, y1: h + 4, cx: cx, radiusAt: radiusAt, phase: 0,
      classA: 'helix-seg--gold', classB: 'helix-seg--indigo',
      withRungs: true
    });

    el.appendChild(svg);
  }

  // -----------------------------------------------------------------------
  // Init
  // -----------------------------------------------------------------------
  function renderAll() {
    renderHero();
    renderBranches();
    renderConvergence();
  }

  function init() {
    renderAll();
    setupStageFade();

    window.addEventListener('resize', debounce(renderAll, 150), { passive: true });

    var onMode = function () { renderAll(); };
    if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', onMode);
    else if (mobileMQ.addListener) mobileMQ.addListener(onMode);

    // Webfonts change column heights after first paint, which moves every measured position.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(renderAll).catch(function () {});
    }
    window.addEventListener('load', renderAll, { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
