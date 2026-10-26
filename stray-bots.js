/* Stray Slagbots.
 *
 * Random Slagbots from the pool in images/slagbots/strays wander onto every
 * page except home, a different crew each visit:
 *
 *  - Drifters float in the foreground, fixed to the window so they stay with
 *    you as you scroll, wandering slowly across the whole screen. Grab one
 *    and fling it: throw it hard enough and it sails off screen, and a new
 *    stray wanders in from an edge a little later. A gentle throw just sends
 *    it drifting on its way.
 *
 * They bob and blink like the other bots on the site (see .bot in
 * styles.css). Visitors who prefer reduced motion get still bots in the
 * margins instead. All the placement lives here, inline, so an old cached
 * stylesheet can never drop them into the page flow.
 */
(function () {
  "use strict";

  var POOL = 12;
  var script = document.currentScript;
  var base = script ? script.src.replace(/stray-bots\.js.*$/, "") : "/";
  var main = document.querySelector("main");
  if (!main) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Shuffle the pool so no bot turns up twice in a row.
  var ids = [];
  for (var i = 1; i <= POOL; i++) ids.push(i);
  for (var j = ids.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var t = ids[j]; ids[j] = ids[k]; ids[k] = t;
  }
  var nextId = 0;
  function takeId() { var id = ids[nextId % POOL]; nextId++; return id; }

  function rand(a, b) { return a + Math.random() * (b - a); }
  var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

  function makeBot(id, sizeRem) {
    var n = (id < 10 ? "0" : "") + id;
    var span = document.createElement("span");
    span.className = "bot stray-bot";
    span.setAttribute("aria-hidden", "true");
    span.style.width = sizeRem + "rem";
    span.style.animationDelay = (-rand(0, 3.2)).toFixed(2) + "s";
    span.style.animationDuration = rand(2.8, 4).toFixed(2) + "s";

    [["", ""], ["-blink", "bot-blink"]].forEach(function (f) {
      var img = document.createElement("img");
      img.src = base + "images/slagbots/strays/stray-" + n + f[0] + ".png";
      img.alt = "";
      img.width = 40; img.height = 40;
      img.draggable = false;
      if (f[1]) {
        img.className = f[1];
        img.style.animationDuration = rand(4.5, 7.5).toFixed(2) + "s";
        img.style.animationDelay = (-rand(0, 6)).toFixed(2) + "s";
      }
      span.appendChild(img);
    });
    return span;
  }

  /* ---------- Drifters ---------- */

  // A layer over the page that ignores the pointer except on the bots.
  var layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:5;overflow:hidden;";
  document.body.appendChild(layer);

  // Where a drifter may wander, in window coordinates: anywhere on screen,
  // just clear of the very top where the nav sits. Each bot favours its own
  // half so two of them don't huddle together.
  function zone(side, size) {
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var half = vw / 2;
    var z = { y0: 4.5 * rem, y1: vh - size - rem };
    if (side === "left") { z.x0 = rem * 0.5; z.x1 = half + vw * 0.15 - size; }
    else { z.x0 = half - vw * 0.15; z.x1 = vw - size - rem * 0.5; }
    if (z.x1 < z.x0) z.x1 = z.x0;
    if (z.y1 < z.y0) z.y1 = z.y0;
    return z;
  }

  function wide() {
    var r = main.getBoundingClientRect();
    return r.left > 10 * rem;
  }

  var drifters = [];

  function spawn(side, enter) {
    var small = !wide();
    var sizeRem = small ? 4 : rand(5.5, 7.5);
    var size = sizeRem * rem;
    var wrap = document.createElement("div");
    wrap.style.cssText = "position:absolute;left:0;top:0;pointer-events:auto;cursor:grab;touch-action:none;will-change:transform;";
    var bot = makeBot(takeId(), sizeRem);
    bot.classList.add("stray-drifter");
    wrap.appendChild(bot);
    layer.appendChild(wrap);

    var z = zone(side, size);
    var d = {
      el: wrap, side: side, size: size,
      x: rand(z.x0, z.x1), y: rand(z.y0, z.y1),
      vx: 0, vy: 0, rot: 0,
      seed: Math.random() * 1000,
      free: false, held: false, gone: false
    };
    if (enter) {
      // Wander in from the nearest window edge.
      var vw = document.documentElement.clientWidth;
      d.x = side === "left" ? -size - 10 : vw + 10;
      d.vx = side === "left" ? rand(90, 140) : -rand(90, 140);
    }
    grab(d);
    drifters.push(d);
    draw(d);
    return d;
  }

  function draw(d) {
    d.el.style.transform = "translate(" + d.x.toFixed(1) + "px," + d.y.toFixed(1) + "px) rotate(" + d.rot.toFixed(1) + "deg)";
  }

  // Click and hold to pick a bot up; let go to throw it.
  function grab(d) {
    var trail = [];
    d.el.addEventListener("pointerdown", function (e) {
      if (d.gone) return;
      e.preventDefault();
      d.held = true; d.free = false;
      d.el.style.cursor = "grabbing";
      d.el.setPointerCapture(e.pointerId);
      d.ox = e.clientX - d.x; d.oy = e.clientY - d.y;
      trail = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    });
    d.el.addEventListener("pointermove", function (e) {
      if (!d.held) return;
      var now = performance.now();
      var nx = e.clientX - d.ox, ny = e.clientY - d.oy;
      d.rot = Math.max(-25, Math.min(25, (nx - d.x) * 1.5));
      d.x = nx; d.y = ny;
      trail.push({ x: e.clientX, y: e.clientY, t: now });
      while (trail.length > 2 && now - trail[0].t > 90) trail.shift();
      draw(d);
    });
    function release(e) {
      if (!d.held) return;
      d.held = false;
      d.el.style.cursor = "grab";
      var a = trail[0], b = trail[trail.length - 1];
      var dt = Math.max(16, b.t - a.t) / 1000;
      d.vx = (b.x - a.x) / dt; d.vy = (b.y - a.y) / dt;
      d.free = true;   // fly freely until it slows down
    }
    d.el.addEventListener("pointerup", release);
    d.el.addEventListener("pointercancel", release);
  }

  function respawnLater(side) {
    setTimeout(function () { if (!document.hidden) spawn(side, true); else respawnLater(side); }, rand(6000, 12000));
  }

  var last = 0;
  function tick(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;

    for (var i = drifters.length - 1; i >= 0; i--) {
      var d = drifters[i];
      if (d.held) continue;
      var z = zone(d.side, d.size);
      var speed = Math.hypot(d.vx, d.vy);

      if (d.free) {
        // Thrown: coast with a little air drag. Fast enough and off it goes.
        d.vx *= Math.pow(0.35, dt); d.vy *= Math.pow(0.35, dt);
        d.rot += d.vx * dt * 0.4;
        if (speed < 120) d.free = false;
      } else {
        // Wander: a slow, smooth drift, pulled gently back into its zone.
        var s = now / 1000 + d.seed;
        d.vx += (Math.sin(s * 0.37) + Math.sin(s * 0.91)) * 16 * dt;
        d.vy += (Math.cos(s * 0.29) + Math.sin(s * 0.73)) * 16 * dt;
        if (d.x < z.x0) d.vx += (z.x0 - d.x) * 1.6 * dt;
        if (d.x > z.x1) d.vx -= (d.x - z.x1) * 1.6 * dt;
        if (d.y < z.y0) d.vy += (z.y0 - d.y) * 1.6 * dt;
        if (d.y > z.y1) d.vy -= (d.y - z.y1) * 1.6 * dt;
        d.vx *= Math.pow(0.55, dt); d.vy *= Math.pow(0.55, dt);
        d.rot += (d.vx * 0.06 - d.rot) * Math.min(1, dt * 3);
      }

      d.x += d.vx * dt; d.y += d.vy * dt;

      // Flung clean off the screen: gone, and someone new turns up later.
      var out = d.x < -d.size - 40 || d.x > vw + 40 || d.y < -d.size - 40 || d.y > vh + 40;
      if (out && (d.free || speed > 60)) {
        d.gone = true;
        d.el.remove();
        drifters.splice(i, 1);
        respawnLater(d.side);
        continue;
      }
      draw(d);
    }
    requestAnimationFrame(tick);
  }

  if (reduce) {
    // Still bots, one in each side margin, only where there is room.
    if (wide()) {
      ["left", "right"].forEach(function (side) {
        var d = spawn(side, false);
        var vw = document.documentElement.clientWidth;
        d.x = side === "left" ? 2 * rem : vw - d.size - 2 * rem;
        d.y = rand(6 * rem, window.innerHeight - d.size - 2 * rem);
        d.el.style.cursor = "default";
        draw(d);
      });
    }
    return;
  }

  var sides = Math.random() < 0.5 ? ["left", "right"] : ["right", "left"];
  var count = wide() ? 2 : 1;
  for (var m = 0; m < count; m++) spawn(sides[m], false);
  requestAnimationFrame(tick);
})();
