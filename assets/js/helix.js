// DNA strand visual across #helix-hero, #helix-branches, #helix-convergence.
//
// LAYOUT: the wide arrangement -- one strand running down beside each history column, forking
// from a single strand in the hero and braiding back together in the convergence section. (A
// narrow gutter helix was tried and rejected: at this page width it reads as a fussy squiggle.)
//
// MARK: each strand is a RIBBON, not a stroked line. It is drawn as a filled band whose width
// oscillates along its length as though the band were twisting about its own axis --
//     halfWidth(y) ∝ |cos(twist(y))|
// so it is broad where it faces the viewer and narrows to an edge where it turns away, the way
// a twisted paper strip does. Opacity follows the same term. That gives the strand dimension
// and presence without any thin hairline, which is what made the stroked version read as harsh.
//
// The band is emitted as a run of short quads rather than one filled outline, because a single
// <path> cannot vary its opacity along its length. Each quad carries its own depth value and the
// whole set is painted back-to-front, so where the two strands cross in the convergence section
// the nearer band genuinely occludes the farther one.
//
// UNITS: each stage's SVG uses a pixel viewBox matching its stage box, so widths, pitches and
// step sizes are real pixels. Stages rebuild on resize.
//
// No build step, no dependencies. prefers-reduced-motion is respected here and in helix.css.

(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var mobileMQ = window.matchMedia('(max-width: 900px)');

  // ---- tuning -----------------------------------------------------------
  var STEP = 9;            // px of strand per emitted quad
  var RIBBON_W = 11;       // px, full face-on width of a band
  var TWIST_PITCH = 340;   // px for one full twist of the band
  var EDGE_MIN = 0.16;     // narrowest the band gets edge-on (0 = a true vanishing point)
  var OP_EDGE = 0.30, OP_FACE = 0.92;

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
      var c = this, a = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(c, a); }, wait);
    };
  }
  function el(tag, attrs) {
    var n = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    return n;
  }
  function buildSvg(w, h, cls) {
    return el('svg', {
      viewBox: '0 0 ' + w + ' ' + h,
      preserveAspectRatio: 'none',
      class: 'helix-svg ' + cls,
      'aria-hidden': 'true',
      focusable: 'false'
    });
  }

  // Twist term shared by every ribbon so the whole page reads as one continuous band.
  function twistAt(y, phase) { return (phase || 0) + 2 * Math.PI * (y / TWIST_PITCH); }

  // Emit a ribbon from samples: [{x, y, hw, op, z}] -- half-width, opacity and depth per sample.
  function emitRibbon(nodes, samples, cls) {
    for (var i = 0; i < samples.length - 1; i++) {
      var a = samples[i], b = samples[i + 1];
      if (a.hw < 0.05 && b.hw < 0.05) continue;
      var d = 'M ' + (a.x - a.hw).toFixed(2) + ' ' + a.y.toFixed(2) +
              ' L ' + (a.x + a.hw).toFixed(2) + ' ' + a.y.toFixed(2) +
              ' L ' + (b.x + b.hw).toFixed(2) + ' ' + b.y.toFixed(2) +
              ' L ' + (b.x - b.hw).toFixed(2) + ' ' + b.y.toFixed(2) + ' Z';
      nodes.push({
        z: a.z,
        node: el('path', { d: d, class: 'helix-ribbon ' + cls, opacity: a.op.toFixed(3) })
      });
    }
  }

  function paint(svg, nodes) {
    nodes.sort(function (a, b) { return a.z - b.z; });
    nodes.forEach(function (n) { svg.appendChild(n.node); });
  }

  // Build ribbon samples along a centre-line function x(y) over [y0, y1].
  //   widthScale(y) -> 0..1 multiplier for tapering the band in/out at the ends
  function sampleRibbon(y0, y1, xOf, widthScale, phase) {
    var out = [];
    var n = Math.max(2, Math.ceil((y1 - y0) / STEP));
    for (var i = 0; i <= n; i++) {
      var y = y0 + (y1 - y0) * (i / n);
      var c = Math.cos(twistAt(y, phase));
      var face = Math.abs(c);                       // 1 = flat to viewer, 0 = edge-on
      var scale = widthScale ? widthScale(y) : 1;
      out.push({
        x: xOf(y),
        y: y,
        hw: (RIBBON_W / 2) * lerp(EDGE_MIN, 1, face) * scale,
        op: lerp(OP_EDGE, OP_FACE, face) * clamp(scale, 0, 1),
        z: c   // which face is toward the viewer; drives paint order where strands cross
      });
    }
    return out;
  }

  // ---- stage fade -------------------------------------------------------
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
  // Hero -- one undivided band, centred, leaving vertical at the bottom so the fork continues it
  // -----------------------------------------------------------------------
  function renderHero() {
    var host = document.getElementById('helix-hero');
    if (!host) return;
    var r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    host.innerHTML = '';

    var w = Math.round(r.width), h = Math.round(r.height);
    var svg = buildSvg(w, h, 'helix-svg--hero');
    var cx = w / 2, amp = Math.min(30, w * 0.03);

    var xOf = function (y) {
      var t = y / h;
      var env = smoothstep(0, 0.3, t) * (1 - smoothstep(0.7, 1, t));
      return cx + amp * env * Math.sin(Math.PI * 2 * 1.2 * t);
    };
    // Fade the band in at the very top rather than starting it mid-air.
    var widthScale = function (y) { return smoothstep(0, h * 0.10, y); };

    var nodes = [];
    emitRibbon(nodes, sampleRibbon(-6, h + 6, xOf, widthScale, 0), 'helix-ribbon--single');
    paint(svg, nodes);
    host.appendChild(svg);
  }

  // -----------------------------------------------------------------------
  // Branches -- fork into one band per column
  // -----------------------------------------------------------------------
  function measureBranches() {
    var section = document.getElementById('branches');
    var stage = document.getElementById('helix-branches');
    var gold = document.getElementById('branch-norovbanzad');
    var indigo = document.getElementById('branch-banzragch');
    if (!section || !stage || !gold || !indigo) return null;

    // Measured against `stage`, the element the SVG fills. `.helix-stage` is absolute/inset:0,
    // which resolves against the section's PADDING box -- using the section's own rect would
    // offset everything by its vertical padding.
    var sr = stage.getBoundingClientRect();
    if (!sr.width || !sr.height) return null;

    var gr = gold.getBoundingClientRect();
    var ir = indigo.getBoundingClientRect();
    var stacked = ir.top > gr.bottom - 1;

    var items = Array.prototype.slice.call(section.querySelectorAll('.timeline__item')).map(function (node) {
      var b = node.getBoundingClientRect();
      return {
        el: node,
        y: (b.top + b.height / 2) - sr.top,
        col: node.closest('.branch--gold') ? 'gold' : 'indigo'
      };
    });

    return {
      w: Math.round(sr.width), h: Math.round(sr.height), stacked: stacked,
      goldX: (gr.left + gr.width / 2) - sr.left,
      indigoX: (ir.left + ir.width / 2) - sr.left,
      items: items
    };
  }

  var branchObserver = null;
  var itemMarks = [];
  var activated = new Set();

  function activate(i) {
    var m = itemMarks[i];
    if (m) m.forEach(function (n) { n.classList.add('is-active'); });
  }

  function setupBranchObserver(items) {
    if (branchObserver) branchObserver.disconnect();
    branchObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = e.target.__helixIdx;
        if (e.isIntersecting && !activated.has(i)) {
          activated.add(i); activate(i); branchObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -10% 0px' });
    items.forEach(function (it, i) {
      it.el.__helixIdx = i;
      if (!activated.has(i)) branchObserver.observe(it.el);
    });
  }

  function renderBranches() {
    var host = document.getElementById('helix-branches');
    if (!host) return;
    var L = measureBranches();
    if (!L) return;
    host.innerHTML = '';

    var svg = buildSvg(L.w, L.h, 'helix-svg--branches' + (L.stacked ? ' helix-svg--stacked' : ''));
    var cx = L.w / 2;
    var forkEnd = L.h * 0.12;
    var nodes = [];

    // Each band leaves the centre and eases out to its column, then drifts gently. smoothstep
    // has zero slope at both ends, so the band leaves the hero's centre line vertically and
    // settles onto its column without a corner.
    function strandX(targetX, driftAmp, driftPeriods) {
      return function (y) {
        var base = cx + (targetX - cx) * smoothstep(0, forkEnd, y);
        var t = clamp((y - forkEnd) / Math.max(1, L.h - forkEnd), 0, 1);
        // Drift fades out at the bottom so both bands arrive where convergence expects them.
        return base + driftAmp * Math.sin(driftPeriods * Math.PI * t) * (1 - smoothstep(0.72, 1, t));
      };
    }

    var goldX = L.stacked ? cx - L.w * 0.30 : L.goldX;
    var indigoX = L.stacked ? cx + L.w * 0.30 : L.indigoX;

    emitRibbon(nodes, sampleRibbon(-6, L.h + 6, strandX(goldX, 14, 3), null, 0), 'helix-ribbon--gold');
    emitRibbon(nodes, sampleRibbon(-6, L.h + 6, strandX(indigoX, 14, 4), null, Math.PI * 0.5), 'helix-ribbon--indigo');

    // Base pairs: one per timeline item, tapering from each band toward the middle so the join
    // reads as a connection rather than a bar ruled across the text.
    var mid = (goldX + indigoX) / 2;

    // Each half is defined as (band end -> centre), never as (left -> right): the thick end and
    // the growth origin both belong to the BAND, whichever side of the page it sits on. Deriving
    // either from numeric x order silently reverses the indigo half, which sits to the right of
    // centre -- it would taper the wrong way and unfurl out of the middle instead of reaching in
    // from its own strand.
    var halves = [
      { bandX: goldX, cls: 'helix-pair--gold', origin: goldX < mid ? '0%' : '100%' },
      { bandX: indigoX, cls: 'helix-pair--indigo', origin: indigoX < mid ? '0%' : '100%' }
    ];

    itemMarks = L.items.map(function (it) {
      var pair = halves.map(function (hf) {
        var t = 3.2;
        var node = el('path', {
          // Thick where it meets its band, tapering to almost nothing at the centre line.
          d: 'M ' + hf.bandX.toFixed(2) + ' ' + (it.y - t).toFixed(2) +
             ' L ' + mid.toFixed(2) + ' ' + (it.y - 0.5).toFixed(2) +
             ' L ' + mid.toFixed(2) + ' ' + (it.y + 0.5).toFixed(2) +
             ' L ' + hf.bandX.toFixed(2) + ' ' + (it.y + t).toFixed(2) + ' Z',
          class: 'helix-pair ' + hf.cls
        });
        node.style.setProperty('--pair-origin', hf.origin);
        return node;
      });
      pair.forEach(function (n) { svg.appendChild(n); });
      return pair;
    });

    paint(svg, nodes);
    // Bands paint over the pairs so the connection tucks behind the strand it joins.
    host.appendChild(svg);

    setupBranchObserver(L.items);
    activated.forEach(activate);
  }

  // -----------------------------------------------------------------------
  // Convergence -- the two bands braid and resolve into one
  // -----------------------------------------------------------------------
  function renderConvergence() {
    var host = document.getElementById('helix-convergence');
    if (!host) return;
    var r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    host.innerHTML = '';

    var w = Math.round(r.width), h = Math.round(r.height);
    var svg = buildSvg(w, h, 'helix-svg--convergence');
    var B = measureBranches();
    var cx = w / 2;
    var goldEntry = B && !B.stacked ? B.goldX : cx - w * 0.22;
    var indigoEntry = B && !B.stacked ? B.indigoX : cx + w * 0.22;

    var t1 = 0.20, t2 = 0.30, t3 = 0.62, t4 = 0.76;
    var ampMax = Math.min(46, w * 0.05), turns = 2;
    var freq = turns / (t3 - t2);

    function braid(entryX, sign) {
      return function (y) {
        var t = y / h;
        var base = entryX + (cx - entryX) * smoothstep(0, t1, t);
        var env = smoothstep(t1, t2, t) * (1 - smoothstep(t3, t4, t));
        return base + sign * env * ampMax * Math.sin(freq * Math.PI * 2 * t);
      };
    }
    // Depth during the braid comes from the same oscillator, so the band in front is the one
    // swinging toward the viewer -- which is what makes the crossings legible.
    function braidPhase(sign) { return sign > 0 ? 0 : Math.PI; }

    var nodes = [];
    emitRibbon(nodes, sampleRibbon(-6, h + 6, braid(goldEntry, 1), null, braidPhase(1)), 'helix-ribbon--gold');
    emitRibbon(nodes, sampleRibbon(-6, h + 6, braid(indigoEntry, -1), null, braidPhase(-1)), 'helix-ribbon--indigo');
    paint(svg, nodes);
    host.appendChild(svg);
  }

  // -----------------------------------------------------------------------
  function renderAll() { renderHero(); renderBranches(); renderConvergence(); }

  function init() {
    renderAll();
    setupStageFade();
    window.addEventListener('resize', debounce(renderAll, 150), { passive: true });
    var onMode = function () { renderAll(); };
    if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', onMode);
    else if (mobileMQ.addListener) mobileMQ.addListener(onMode);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderAll).catch(function () {});
    window.addEventListener('load', renderAll, { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
