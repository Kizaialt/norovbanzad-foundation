// Compact DNA marks for #dna-hero and #dna-merge.
//
// WHY COMPACT: a helix only reads as a helix when several full turns are visible at once. Drawn
// across a whole page section (~2800px tall) each turn becomes a long shallow wave that reads as
// a stray line, and it has to sit behind body copy where it competes with the text. Earlier
// versions of this file did exactly that -- as a stroked line, then as a twisted ribbon -- and
// both looked wrong for that reason rather than because of their styling. Here the same geometry
// is drawn small and self-contained, where roughly three turns are visible in ~150px and the
// form is legible instantly.
//
// GEOMETRY (viewer looking down -z, axis vertical):
//   theta(y) = 2*pi*y/pitch
//   A: x = cx - R(y)sin(theta), depth  cos(theta)
//   B: x = cx + R(y)sin(theta), depth -cos(theta)
// B is A rotated by pi, so when one strand is nearest the viewer the other is furthest. A rung's
// projected width is 2R|sin(theta)| -- full at the widest point, vanishing where the strands
// cross. Every element is sorted by depth and painted back-to-front, so the near strand really
// does occlude the far one; that occlusion is what sells it as three-dimensional.
//
// The merge mark tapers R to 0 so the two strands close into a single line, under the heading
// that says the same thing.
//
// No build step, no dependencies. Sizes come from CSS; the SVG scales to its box.

(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(e0, e1, x) {
    var t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    return n;
  }

  // Draw a helix into a fresh SVG sized W x H (user units; CSS scales it).
  //   opts.taper -- when true, radius closes to 0 over the lower part of the mark
  function makeMark(W, H, opts) {
    opts = opts || {};
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      class: 'dna-svg',
      'aria-hidden': 'true',
      focusable: 'false'
    });

    var cx = W / 2;
    var R = W * 0.34;
    var pitch = H / 2.6;              // ~2.6 turns over the mark: enough to read, not busy
    var theta = function (y) { return 2 * Math.PI * (y / pitch); };

    var radiusAt = function (y) {
      // Open from a point at the very top so the form grows out of a single strand.
      var open = smoothstep(0, H * 0.10, y);
      var close = opts.taper ? (1 - smoothstep(H * 0.45, H * 0.86, y)) : 1;
      return R * open * close;
    };

    var xA = function (y) { return cx - radiusAt(y) * Math.sin(theta(y)); };
    var xB = function (y) { return cx + radiusAt(y) * Math.sin(theta(y)); };

    var nodes = [];

    // Rungs first (depth 0 -- half the backbone passes in front of them, half behind).
    var rungStep = pitch / 6;
    for (var y = rungStep; y < H; y += rungStep) {
      var x1 = xA(y), x2 = xB(y);
      if (Math.abs(x2 - x1) < 1) continue;
      nodes.push({
        z: 0,
        node: el('line', {
          x1: x1.toFixed(2), y1: y.toFixed(2), x2: x2.toFixed(2), y2: y.toFixed(2),
          class: 'dna-rung',
          'stroke-width': '1.15',
          opacity: (0.30 + 0.35 * Math.abs(Math.sin(theta(y)))).toFixed(3)
        })
      });
    }

    // Backbones as short depth-sorted segments.
    var step = 3;
    for (var side = 0; side < 2; side++) {
      var xf = side === 0 ? xA : xB;
      var cls = side === 0 ? 'dna-strand--gold' : 'dna-strand--indigo';
      for (var yy = 0; yy < H; yy += step) {
        var ya = yy, yb = Math.min(H, yy + step), ym = (ya + yb) / 2;
        var z = Math.cos(theta(ym)) * (side === 0 ? 1 : -1);
        var d = (z + 1) / 2;
        nodes.push({
          z: z,
          node: el('path', {
            d: 'M ' + xf(ya).toFixed(2) + ' ' + ya.toFixed(2) +
               ' Q ' + xf(ym).toFixed(2) + ' ' + ym.toFixed(2) +
               ' ' + xf(yb).toFixed(2) + ' ' + yb.toFixed(2),
            class: 'dna-strand ' + cls,
            'stroke-width': lerp(1.1, 2.3, d).toFixed(2),
            opacity: lerp(0.34, 1, d).toFixed(3),
            fill: 'none'
          })
        });
      }
    }

    nodes.sort(function (a, b) { return a.z - b.z; });
    nodes.forEach(function (n) { svg.appendChild(n.node); });
    return svg;
  }

  function render() {
    var hero = document.getElementById('dna-hero');
    if (hero) {
      hero.innerHTML = '';
      hero.appendChild(makeMark(54, 150, { taper: false }));
    }
    var merge = document.getElementById('dna-merge');
    if (merge) {
      merge.innerHTML = '';
      merge.appendChild(makeMark(54, 150, { taper: true }));
    }
  }

  // Reveal each mark when it scrolls into view.
  function setupReveal() {
    var marks = document.querySelectorAll('.dna-mark');
    if (!marks.length) return;
    if (!('IntersectionObserver' in window)) {
      marks.forEach(function (m) { m.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.35 });
    marks.forEach(function (m) { io.observe(m); });
  }

  function init() { render(); setupReveal(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
