// Owned by the DNA-helix visual subagent. Renders/animates the strand across #helix-hero, #helix-branches, #helix-convergence.
//
// Three inline-SVG layers built once (and rebuilt on resize/breakpoint change for the
// measurement-dependent stages): a single sine-curve backbone in the hero, two strands
// that fork toward the two history columns in the branches section (with per-timeline-item
// "rung" reveals driven by IntersectionObserver), and a braided double-helix that resolves
// back into one strand in the convergence section.
//
// No build step, no dependencies. All motion is transform/opacity driven so it stays cheap,
// and prefers-reduced-motion is respected both here and via the global override in base.css.

(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  var mobileMQ = window.matchMedia('(max-width: 900px)');
  // Ambient/scroll animation is neutralized declaratively in helix.css (and globally in
  // base.css) via @media (prefers-reduced-motion: reduce); no JS branching needed here --
  // reveals still fire on scroll but jump straight to their end state instead of easing in.

  // ---------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function smoothstep(edge0, edge1, x) {
    var t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
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
    var node = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (var key in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, key)) {
          node.setAttribute(key, attrs[key]);
        }
      }
    }
    return node;
  }

  function buildSvgRoot(extraClass) {
    return svgEl('svg', {
      viewBox: '0 0 100 100',
      preserveAspectRatio: 'none',
      class: 'helix-svg' + (extraClass ? ' ' + extraClass : ''),
      'aria-hidden': 'true',
      focusable: 'false'
    });
  }

  // Smooths a polyline of [x,y] points into a quadratic-bezier path: each
  // original point becomes a control point, the curve passes through the
  // midpoints between consecutive points. Cheap, precomputed once, no
  // per-frame cost.
  function smoothPathD(points) {
    if (!points.length) return '';
    var d = 'M ' + points[0][0].toFixed(2) + ' ' + points[0][1].toFixed(2);
    for (var i = 1; i < points.length; i++) {
      var prev = points[i - 1], cur = points[i];
      var midX = (prev[0] + cur[0]) / 2;
      var midY = (prev[1] + cur[1]) / 2;
      d += ' Q ' + prev[0].toFixed(2) + ' ' + prev[1].toFixed(2) + ' ' + midX.toFixed(2) + ' ' + midY.toFixed(2);
    }
    var last = points[points.length - 1];
    d += ' L ' + last[0].toFixed(2) + ' ' + last[1].toFixed(2);
    return d;
  }

  // Generic sine sampler over a vertical span. With phase=0 and a
  // half-integer/integer freq, x(0) and x(1) both land exactly on x0 --
  // handy for pinning a strand's endpoints so adjoining sections meet
  // without a visible seam.
  function sinePoints(opts) {
    var steps = opts.steps || 48;
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var y = opts.y0 + (opts.y1 - opts.y0) * t;
      var x = opts.x0 + opts.amp * Math.sin(opts.freq * Math.PI * 2 * t + (opts.phase || 0));
      pts.push([x, y]);
    }
    return pts;
  }

  // Builds the points for a strand that starts centered (x=50) at the top
  // of the branches section, curves out toward targetX by forkY, then
  // continues down with a gentle wobble that is pinned back to exactly
  // targetX at the very bottom (so the convergence section's strand,
  // which starts at the same targetX, meets it with no jump).
  function forkedStrandPoints(targetX, forkY, opts) {
    opts = opts || {};
    var amp = opts.amp != null ? opts.amp : 2;
    var halfPeriods = opts.halfPeriods != null ? opts.halfPeriods : 3;
    var steps = opts.steps || 40;
    var pts = [
      [50, -2],
      [50, forkY * 0.4],
      [(50 + targetX) / 2, forkY * 0.78],
      [targetX, forkY]
    ];
    for (var i = 1; i <= steps; i++) {
      var tl = i / steps;
      var y = forkY + (102 - forkY) * tl;
      var x = targetX + amp * Math.sin(halfPeriods * Math.PI * tl);
      pts.push([x, y]);
    }
    return pts;
  }

  // ---------------------------------------------------------------------
  // Stage-level entrance (fade the whole layer in once its section is
  // within view; hero fires this almost immediately since it's the first
  // thing on the page).
  // ---------------------------------------------------------------------

  var stageObserver = null;

  function setupStageFade() {
    var stages = document.querySelectorAll('.helix-stage');
    if (!stages.length) return;
    if (stageObserver) stageObserver.disconnect();
    stageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          stageObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    stages.forEach(function (stage) { stageObserver.observe(stage); });
  }

  // ---------------------------------------------------------------------
  // Hero -- single unbranched backbone
  // ---------------------------------------------------------------------

  function renderHero() {
    var container = document.getElementById('helix-hero');
    if (!container) return;
    container.innerHTML = '';

    var svg = buildSvgRoot('helix-svg--hero');
    var defs = svgEl('defs');
    var grad = svgEl('linearGradient', { id: 'helix-hero-grad', x1: '0', y1: '0', x2: '0', y2: '1' });
    grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': 'var(--color-gold-deep)' }));
    grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': 'var(--color-indigo)' }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    // freq 1.5 => 3 half-periods, phase 0 => pinned to x=50 at both ends.
    var pts = sinePoints({ x0: 50, y0: -2, y1: 102, amp: 5, freq: 1.5, phase: 0, steps: 48 });
    var path = svgEl('path', { d: smoothPathD(pts), class: 'helix-strand helix-strand--hero', fill: 'none' });
    path.style.stroke = 'url(#helix-hero-grad)';
    svg.appendChild(path);

    container.appendChild(svg);
  }

  // ---------------------------------------------------------------------
  // Branches -- measurement, desktop fork, mobile single-strand fallback
  // ---------------------------------------------------------------------

  function measureBranches() {
    var section = document.getElementById('branches');
    var goldCol = document.getElementById('branch-norovbanzad');
    var indigoCol = document.getElementById('branch-foundation');
    if (!section || !goldCol || !indigoCol) return null;

    var sectionRect = section.getBoundingClientRect();
    if (!sectionRect.width || !sectionRect.height) return null;

    var goldRect = goldCol.getBoundingClientRect();
    var indigoRect = indigoCol.getBoundingClientRect();

    var goldX = clamp(((goldRect.left + goldRect.width / 2) - sectionRect.left) / sectionRect.width * 100, 5, 95);
    var indigoX = clamp(((indigoRect.left + indigoRect.width / 2) - sectionRect.left) / sectionRect.width * 100, 5, 95);
    var boundaryY = clamp(((indigoRect.top) - sectionRect.top) / sectionRect.height * 100, 5, 95);

    var itemNodes = Array.prototype.slice.call(section.querySelectorAll('.timeline__item'));
    var items = itemNodes.map(function (node) {
      var r = node.getBoundingClientRect();
      var y = clamp(((r.top + r.height / 2) - sectionRect.top) / sectionRect.height * 100, 2, 98);
      var col = node.closest('.branch--gold') ? 'gold' : 'indigo';
      return { el: node, y: y, col: col };
    });

    return { goldX: goldX, indigoX: indigoX, boundaryY: boundaryY, items: items };
  }

  function renderBranchesDesktop(container, layout) {
    var svg = buildSvgRoot('helix-svg--branches');
    var forkY = 12;

    var goldPts = forkedStrandPoints(layout.goldX, forkY, { amp: 2, halfPeriods: 3 });
    var indigoPts = forkedStrandPoints(layout.indigoX, forkY, { amp: 2, halfPeriods: 4 });

    var goldPath = svgEl('path', { d: smoothPathD(goldPts), class: 'helix-strand helix-strand--gold', fill: 'none' });
    var indigoPath = svgEl('path', { d: smoothPathD(indigoPts), class: 'helix-strand helix-strand--indigo', fill: 'none' });
    svg.appendChild(goldPath);
    svg.appendChild(indigoPath);

    var rungGroup = svgEl('g', { class: 'helix-rungs' });
    svg.appendChild(rungGroup);

    var midX = (layout.goldX + layout.indigoX) / 2;

    var refs = layout.items.map(function (item) {
      var y = item.y.toFixed(2);
      var leftHalf = svgEl('line', {
        x1: layout.goldX.toFixed(2), y1: y, x2: midX.toFixed(2), y2: y,
        class: 'helix-rung-half helix-rung-half--gold', fill: 'none'
      });
      var rightHalf = svgEl('line', {
        x1: midX.toFixed(2), y1: y, x2: layout.indigoX.toFixed(2), y2: y,
        class: 'helix-rung-half helix-rung-half--indigo', fill: 'none'
      });
      rungGroup.appendChild(leftHalf);
      rungGroup.appendChild(rightHalf);
      return [leftHalf, rightHalf];
    });

    container.appendChild(svg);
    return refs;
  }

  function renderBranchesMobile(container, layout) {
    var svg = buildSvgRoot('helix-svg--branches helix-svg--branches-mobile');
    var defs = svgEl('defs');
    var gradId = 'helix-branches-mobile-grad';
    var grad = svgEl('linearGradient', { id: gradId, x1: '0', y1: '0', x2: '0', y2: '1' });
    var b = layout.boundaryY;
    var s1 = clamp(b - 10, 0, 100), s2 = clamp(b + 10, 0, 100);
    [[0, '--color-gold-deep'], [s1, '--color-gold-deep'], [s2, '--color-indigo'], [100, '--color-indigo']].forEach(function (pair) {
      grad.appendChild(svgEl('stop', { offset: pair[0] + '%', 'stop-color': 'var(' + pair[1] + ')' }));
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    // freq 2 => 4 half-periods, phase 0 => pinned to x=50 at both ends.
    var pts = sinePoints({ x0: 50, y0: -2, y1: 102, amp: 3.5, freq: 2, phase: 0, steps: 48 });
    var path = svgEl('path', { d: smoothPathD(pts), class: 'helix-strand helix-strand--mobile', fill: 'none' });
    path.style.stroke = 'url(#' + gradId + ')';
    svg.appendChild(path);

    var tickGroup = svgEl('g', { class: 'helix-ticks' });
    svg.appendChild(tickGroup);

    var refs = layout.items.map(function (item) {
      var y = item.y.toFixed(2);
      var isGold = item.col === 'gold';
      var x2 = isGold ? 50 - 7 : 50 + 7;
      var tick = svgEl('line', {
        x1: '50', y1: y, x2: x2.toFixed(2), y2: y,
        class: 'helix-tick ' + (isGold ? 'helix-tick--gold' : 'helix-tick--indigo'),
        fill: 'none'
      });
      tickGroup.appendChild(tick);
      return [tick];
    });

    container.appendChild(svg);
    return refs;
  }

  var branchObserver = null;
  var branchRungRefs = [];
  var activatedBranchItems = new Set();

  function applyActive(idx) {
    var refs = branchRungRefs[idx];
    if (!refs) return;
    refs.forEach(function (node) { node.classList.add('is-active'); });
  }

  function setupBranchObserver(items) {
    if (branchObserver) branchObserver.disconnect();
    branchObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var idx = entry.target.__helixIdx;
        if (entry.isIntersecting && !activatedBranchItems.has(idx)) {
          activatedBranchItems.add(idx);
          applyActive(idx);
          branchObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -10% 0px' });

    items.forEach(function (item, idx) {
      item.el.__helixIdx = idx;
      if (!activatedBranchItems.has(idx)) branchObserver.observe(item.el);
    });
  }

  function renderBranches() {
    var container = document.getElementById('helix-branches');
    if (!container) return;
    var layout = measureBranches();
    if (!layout) return;

    container.innerHTML = '';
    var refs = mobileMQ.matches ? renderBranchesMobile(container, layout) : renderBranchesDesktop(container, layout);
    branchRungRefs = refs;

    setupBranchObserver(layout.items);
    activatedBranchItems.forEach(function (idx) { applyActive(idx); });
  }

  // ---------------------------------------------------------------------
  // Convergence -- braid that resolves into one strand
  // ---------------------------------------------------------------------

  function renderConvergence() {
    var container = document.getElementById('helix-convergence');
    if (!container) return;
    container.innerHTML = '';

    var layout = measureBranches();
    var goldEntryX = layout ? layout.goldX : 28;
    var indigoEntryX = layout ? layout.indigoX : 72;

    var svg = buildSvgRoot('helix-svg--convergence');

    var steps = 90;
    var t1 = 0.16, t2 = 0.24, t3 = 0.56, t4 = 0.7;
    var ampMax = 10, periodsVisible = 2.5;
    var freq = periodsVisible / (t3 - t2);

    var goldPts = [], indigoPts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var y = -2 + 104 * t;
      var baseG = goldEntryX + (50 - goldEntryX) * smoothstep(0, t1, t);
      var baseI = indigoEntryX + (50 - indigoEntryX) * smoothstep(0, t1, t);
      var env = smoothstep(t1, t2, t) * (1 - smoothstep(t3, t4, t));
      var osc = ampMax * Math.sin(freq * Math.PI * 2 * t);
      goldPts.push([baseG + env * osc, y]);
      indigoPts.push([baseI - env * osc, y]);
    }

    var goldPath = svgEl('path', { d: smoothPathD(goldPts), class: 'helix-strand helix-strand--gold', fill: 'none' });
    var indigoPath = svgEl('path', { d: smoothPathD(indigoPts), class: 'helix-strand helix-strand--indigo', fill: 'none' });
    svg.appendChild(indigoPath);
    svg.appendChild(goldPath);

    // Small "base pair" nodes at each braid crossing (where the oscillation
    // term is exactly zero), echoing the rung motif from the branches stage.
    for (var k = 1; k < 200; k++) {
      var tc = k / (2 * freq);
      if (tc <= t2 + 0.015) continue;
      if (tc >= t3 - 0.015) break;
      var ny = -2 + 104 * tc;
      svg.appendChild(svgEl('circle', { cx: '50', cy: ny.toFixed(2), r: '1.1', class: 'helix-braid-node' }));
    }

    container.appendChild(svg);
  }

  // ---------------------------------------------------------------------
  // Init + responsive re-render
  // ---------------------------------------------------------------------

  function init() {
    renderHero();
    renderBranches();
    renderConvergence();
    setupStageFade();

    var onResize = debounce(function () {
      renderBranches();
      renderConvergence();
    }, 150);
    window.addEventListener('resize', onResize, { passive: true });

    var onLayoutModeChange = function () { renderBranches(); renderConvergence(); };
    if (typeof mobileMQ.addEventListener === 'function') {
      mobileMQ.addEventListener('change', onLayoutModeChange);
    } else if (typeof mobileMQ.addListener === 'function') {
      mobileMQ.addListener(onLayoutModeChange);
    }

    // Re-measure once webfonts settle, since Playfair/Inter swapping in can
    // shift column/line heights slightly after the first paint.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        renderBranches();
        renderConvergence();
      }).catch(function () {});
    }
    window.addEventListener('load', function () {
      renderBranches();
      renderConvergence();
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
