/* Slag pour.
 *
 * A 120 by 64 pixel night scene for the Slagbot origin story: a slag pot on
 * the rail at the top of the heap tips molten slag down the slope, the river
 * glows and cools as it runs, embers lift off it, and a smokestack blinks in
 * the distance. Drawn one pixel at a time and scaled up crisp by CSS.
 *
 * Runs only while the canvas is on screen. Visitors who prefer reduced motion
 * get a single still frame of the pour in full flow.
 */
(function () {
  "use strict";

  var cv = document.getElementById("slag-pour");
  if (!cv || !cv.getContext) return;
  var c = cv.getContext("2d");
  var W = 120, H = 64;

  var BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  var LIP_X = 31, LIP_Y = 19;

  // Surface of the heap: flat on top where the rail runs, then a long slope.
  function slopeY(x) {
    return x < 30 ? 24 : Math.min(H - 1, Math.round(24 + (x - 30) * 0.44));
  }

  // Seeded random so the heap texture is the same every load.
  var seed = 7;
  function srand() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

  // Molten colour by heat, hottest first.
  var RAMP = [
    [0.86, "#fff3b0"],
    [0.68, "#ffd54a"],
    [0.48, "#fc7800"],
    [0.3, "#c2401a"],
    [0.16, "#6e2014"],
    [0.07, "#3a1612"]
  ];
  function heatColour(h) {
    for (var i = 0; i < RAMP.length; i++) if (h >= RAMP[i][0]) return RAMP[i][1];
    return null;
  }

  // Static layers drawn once: sky, stars, stack, heap, rail, pot.
  var base = document.createElement("canvas");
  base.width = W; base.height = H;
  var b = base.getContext("2d");
  function px(ctx, col, x, y) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }

  (function drawBase() {
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var glow = (y / H) * 12 + Math.max(0, (x - 30) / W) * 6;
      px(b, glow > BAYER[y % 4][x % 4] + 4 ? "#2a1014" : "#110c17", x, y);
    }
    [[6, 4], [14, 9], [23, 3], [41, 6], [52, 2], [63, 8], [77, 4], [108, 3], [115, 9], [3, 12]]
      .forEach(function (p) { px(b, "#8b949e", p[0], p[1]); });

    // Smokestack on the horizon
    for (var sy = 6; sy < H; sy++) {
      var half = sy < 9 ? 1 : 1 + Math.floor((sy - 9) / 22);
      for (var sx = 96 - half; sx <= 96 + half; sx++) px(b, "#1c1820", sx, sy);
    }

    // Heap
    for (var hx = 0; hx < W; hx++) {
      var t = slopeY(hx);
      for (var hy = t; hy < H; hy++) {
        var r = srand();
        px(b, hy === t ? "#5a4650" : r < 0.12 ? "#3a3038" : r < 0.16 ? "#16111a" : "#241c24", hx, hy);
      }
    }

    // Rail along the top of the heap
    for (var rx = 0; rx < 31; rx++) px(b, "#4a4550", rx, 23);
    for (var tx = 1; tx < 31; tx += 3) px(b, "#16111a", tx, 23);

    // Slag pot tipped toward the slope, on a little car
    var pot = [
      "....OOOOOOOO..",
      "...OGGGGGGGGO.",
      "..OKKKKKKKKKGO",
      "..OKKKKKKKKKKO",
      ".OKKKKKKKKKKO.",
      ".OKKKKKKKKKO..",
      "..OKKKKKKKO...",
      "...OOOOOOO....",
      ".OOOOOOOOOOO..",
      ".O.O.....O.O.."
    ];
    var pal = { O: "#100e14", K: "#2f2c36", G: "#fc7800" };
    pot.forEach(function (row, j) {
      for (var i = 0; i < row.length; i++) {
        var ch = row[i];
        if (ch !== ".") px(b, pal[ch], 17 + i, 14 + j);
      }
    });
  })();

  // Moving parts
  var heat = new Float32Array(W * H);
  var flow = [];
  var embers = [];
  var frame = 0;

  function step() {
    frame++;

    // The pour surges and eases so it never looks mechanical.
    var rate = 3 + Math.sin(frame / 40) * 1.5 + Math.sin(frame / 13) * 0.8;
    for (var n = 0; n < rate; n++) {
      flow.push({ x: LIP_X + Math.random(), v: 0.35 + Math.random() * 0.35, h: 1, o: Math.random() < 0.55 ? 0 : Math.random() < 0.7 ? 1 : 2 });
    }

    for (var i = flow.length - 1; i >= 0; i--) {
      var f = flow[i];
      f.x += f.v;
      f.v = Math.min(f.v + 0.01, 1.1);
      f.h -= 0.006 + f.x / 26000;
      var fx = Math.floor(f.x);
      if (fx >= W || f.h <= 0) { flow.splice(i, 1); continue; }
      var fy = slopeY(fx) - 1 - f.o;
      var k = fy * W + fx;
      heat[k] = Math.max(heat[k], f.h);
      if (Math.random() < 0.012 && embers.length < 40) {
        embers.push({ x: fx, y: fy - 1, vx: (Math.random() - 0.5) * 0.3, vy: -0.25 - Math.random() * 0.35, life: 30 + Math.random() * 40, age: 0 });
      }
    }

    // Stream falling from the lip of the pot onto the heap
    for (var sy = LIP_Y; sy < 24; sy++) {
      heat[sy * W + LIP_X] = 0.9 + Math.random() * 0.1;
      if (Math.random() < 0.5) heat[sy * W + LIP_X + 1] = 0.7;
    }
    if (Math.random() < 0.08 && embers.length < 40) {
      embers.push({ x: LIP_X, y: LIP_Y, vx: Math.random() * 0.4, vy: -0.4 - Math.random() * 0.4, life: 25 + Math.random() * 30, age: 0 });
    }

    // The river cools where it sits
    for (var h = 0; h < heat.length; h++) if (heat[h] > 0) heat[h] = Math.max(0, heat[h] - 0.004);

    for (var e = embers.length - 1; e >= 0; e--) {
      var em = embers[e];
      em.x += em.vx; em.y += em.vy; em.vy += 0.004; em.age++;
      if (em.age > em.life || em.y < 0) embers.splice(e, 1);
    }
  }

  function draw() {
    c.drawImage(base, 0, 0);

    // Sky over the pour brightens with the flow, fading out from the river
    var glow = 0.16 + Math.min(flow.length / 700, 0.14);
    for (var y = 4; y < 40; y++) for (var x = 24; x < 110; x++) {
      if (y >= slopeY(x)) continue;
      var d = Math.hypot((x - 55) / 1.8, y - 30) / 28;
      if (d < 1 && BAYER[y % 4][x % 4] / 16 > d) {
        c.fillStyle = "rgba(252,120,0," + (glow * (1 - d)).toFixed(3) + ")";
        c.fillRect(x, y, 1, 1);
      }
    }

    for (var k = 0; k < heat.length; k++) {
      var col = heatColour(heat[k]);
      if (col) { c.fillStyle = col; c.fillRect(k % W, (k / W) | 0, 1, 1); }
    }

    embers.forEach(function (em) {
      var life = 1 - em.age / em.life;
      c.fillStyle = life > 0.6 ? "#ffd54a" : life > 0.3 ? "#fc7800" : "#b8361a";
      c.fillRect(Math.round(em.x), Math.round(em.y), 1, 1);
    });

    // Beacon on the stack
    if ((frame >> 4) % 4 === 0) px(c, "#ff3344", 96, 5);
  }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    for (var i = 0; i < 260; i++) step();
    draw();
    return;
  }

  // Warm up so the river is already running when it comes into view
  for (var w = 0; w < 160; w++) step();
  draw();

  var running = false, last = 0;
  function loop(t) {
    if (!running) return;
    if (t - last > 50) { last = t; step(); draw(); }
    requestAnimationFrame(loop);
  }
  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }
  function stop() { running = false; }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }).observe(cv);
  } else {
    start();
  }
})();
