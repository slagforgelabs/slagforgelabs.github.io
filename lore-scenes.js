/* Lore scenes.
 *
 * Two more 120 by 64 pixel scenes for the Slagbot origin story, in the same
 * style as the night pour (slag-pour.js):
 *
 *   #slag-wake   A Slagbot pushes up out of the slag heap, shedding molten
 *                drips, and its eyes switch on.
 *   #slag-march  A Slagboss on the ridge leads crews of small Slagbots up out
 *                of the pit. The crews watch their boss as they climb.
 *
 * Each scene plays, holds, dithers to dark and starts again. They only run
 * while on screen. Reduced motion gets a still of the finished moment.
 */
(function () {
  "use strict";

  var W = 120, H = 64;
  var BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  var script = document.currentScript;
  var base = script ? script.src.replace(/lore-scenes\.js.*$/, "") : "/";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function px(c, col, x, y) { c.fillStyle = col; c.fillRect(x, y, 1, 1); }

  var RAMP = [[0.86, "#fff3b0"], [0.68, "#ffd54a"], [0.48, "#fc7800"], [0.3, "#c2401a"], [0.16, "#6e2014"]];
  function heatColour(h) {
    for (var i = 0; i < RAMP.length; i++) if (h >= RAMP[i][0]) return RAMP[i][1];
    return null;
  }

  function seeded(s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

  function sky(c, glowX, glowY, seed) {
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var d = Math.hypot((x - glowX) / 2.2, y - glowY) / 30;
      var lvl = (1 - Math.min(d, 1)) * 14 + (y / H) * 4;
      px(c, lvl > BAYER[y % 4][x % 4] + 5 ? "#2a1014" : "#110c17", x, y);
    }
    var r = seeded(seed);
    for (var i = 0; i < 12; i++) px(c, "#8b949e", Math.floor(r() * W), Math.floor(r() * 18));
  }

  function heap(c, groundY, seed) {
    var r = seeded(seed);
    for (var x = 0; x < W; x++) {
      var t = groundY(x);
      for (var y = t; y < H; y++) {
        var v = r();
        px(c, y === t ? "#5a4650" : v < 0.12 ? "#3a3038" : v < 0.16 ? "#16111a" : "#241c24", x, y);
      }
    }
  }

  // Dither the whole scene to dark: amount 0 shows nothing, 1 covers it all.
  function dim(c, amount) {
    if (amount <= 0) return;
    c.fillStyle = "#0b0810";
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      if (BAYER[y % 4][x % 4] / 16 < amount) c.fillRect(x, y, 1, 1);
    }
  }

  function loadImg(name) {
    var im = new Image();
    im.src = base + "images/slagbots/sprites/" + name + ".png";
    return im;
  }

  // Runs a scene's draw(t) at about 20 frames a second while it is on screen.
  function run(cv, draw, still) {
    var c = cv.getContext("2d");
    if (reduce) { draw(c, still); return; }
    var running = false, t0 = null, last = 0;
    function loop(now) {
      if (!running) return;
      if (t0 === null) t0 = now;
      if (now - last > 50) { last = now; draw(c, (now - t0) / 1000); }
      requestAnimationFrame(loop);
    }
    draw(c, 0);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { if (!running) { running = true; requestAnimationFrame(loop); } }
        else running = false;
      }).observe(cv);
    } else { running = true; requestAnimationFrame(loop); }
  }

  /* ---------- Scene 1: waking up ---------- */
  (function () {
    var cv = document.getElementById("slag-wake");
    if (!cv) return;
    var bot = loadImg("local"), botOff = loadImg("local-blink");
    var SURF = 48, BX = 40;               // sprite is 40px; feet on its row 32
    var groundY = function (x) {
      var hump = Math.max(0, 1 - Math.abs(x - 60) / 30);
      return Math.round(SURF + 2 - hump * 4 + Math.sin(x / 7) * 1.2);
    };

    var bg = document.createElement("canvas");
    bg.width = W; bg.height = H;
    var b = bg.getContext("2d");
    sky(b, 60, 46, 11);
    heap(b, groundY, 5);

    var CYCLE = 9;
    var drips = [], lastT = 0;

    function draw(c, t) {
      var tc = t % CYCLE;
      if (tc < lastT) drips = [];
      lastT = tc;

      c.drawImage(bg, 0, 0);

      // 0 to 1: a glow builds in the slag. 1 to 4: the bot rises. 4.3: eyes on.
      var glow = Math.min(1, tc / 1.2);
      var rise = Math.max(0, Math.min(1, (tc - 1) / 3));
      rise = 1 - Math.pow(1 - rise, 2);
      var surf = groundY(60);

      // Hot crack in the slag where it breaks through
      for (var x = 48; x < 73; x++) {
        var h = glow * (1 - Math.abs(x - 60) / 13) * (0.75 + 0.25 * Math.sin(t * 6 + x));
        var col = heatColour(h);
        if (col) px(c, col, x, groundY(x));
        if (h > 0.5) { var col2 = heatColour(h * 0.6); if (col2) px(c, col2, x, groundY(x) + 1); }
      }

      // The bot, clipped at the surface so it climbs out of the heap
      var shake = rise < 1 ? Math.round(Math.sin(t * 40) * 0.6) : 0;
      var bob = rise >= 1 ? Math.round(Math.sin(t * 2.4)) : 0;
      var top = surf - 32 + Math.round((1 - rise) * 30) - bob;
      var eyesOn = tc > 4.3 && !(tc > 6.6 && tc < 6.75);
      c.save();
      c.beginPath(); c.rect(0, 0, W, surf + 1); c.clip();
      if (bot.complete && botOff.complete) c.drawImage(eyesOn ? bot : botOff, 60 - 20 + shake, top);
      c.restore();

      // Molten slag sliding off as it rises
      if (rise > 0 && rise < 1 && Math.random() < 0.7) {
        drips.push({ x: 60 + (Math.random() < 0.5 ? -9 : 8) + Math.random() * 2, y: top + 12 + Math.random() * 12, vy: 0, h: 0.95 });
      }
      if (rise > 0.1 && rise < 1 && Math.random() < 0.25) {
        drips.push({ x: 52 + Math.random() * 16, y: surf - 1, vy: -0.8 - Math.random() * 0.8, h: 0.9, ember: true });
      }
      for (var i = drips.length - 1; i >= 0; i--) {
        var d = drips[i];
        d.vy += d.ember ? 0.03 : 0.12; d.y += d.vy; d.h -= d.ember ? 0.02 : 0.01;
        if (!d.ember && d.y >= groundY(Math.round(d.x))) { d.y = groundY(Math.round(d.x)) - 1; d.vy = 0; d.h -= 0.02; }
        var col3 = heatColour(d.h);
        if (!col3 || d.y < 0) { drips.splice(i, 1); continue; }
        px(c, col3, Math.round(d.x), Math.round(d.y));
      }

      dim(c, tc > CYCLE - 0.8 ? (tc - (CYCLE - 0.8)) / 0.6 : tc < 0.4 ? 1 - tc / 0.4 : 0);
    }
    function start() { run(cv, draw, 5.5); }
    if (bot.complete && botOff.complete) start();
    else { var n = 0; bot.onload = botOff.onload = function () { if (++n === 2) start(); }; }
  })();

  /* ---------- Scene 2: out of the pits ---------- */
  (function () {
    var cv = document.getElementById("slag-march");
    if (!cv) return;
    var boss = loadImg("boss"), bossOff = loadImg("boss-blink");

    // Pit on the left, a slope, then the ridge the boss walks along.
    function groundY(x) {
      if (x < 14) return 60;
      if (x < 74) return Math.round(60 - (x - 14) * 0.37);
      return 38;
    }

    var bg = document.createElement("canvas");
    bg.width = W; bg.height = H;
    var b = bg.getContext("2d");
    sky(b, 100, 30, 23);
    heap(b, groundY, 9);
    // last embers in the pit
    [[3, 59], [7, 60], [10, 59], [5, 61], [12, 60]].forEach(function (p, i) {
      px(b, i % 2 ? "#6e2014" : "#c2401a", p[0], p[1]);
    });

    // Small Slagbot, 7 by 9. M plate, A trim, E eye glow, O outline.
    var MINI = [
      "...E...",
      "..OOO..",
      ".OMMMO.",
      "OMMEMEO",
      "OMMMMMO",
      ".OOOOO.",
      ".OMAMO.",
      ".OMMMO.",
      ".OO.OO."
    ];
    var STEP = ".O.O.O.";
    var PLATES = [["#b5523b", "#e0b23c", "#ff7a2f"], ["#7d8a99", "#2e9c9a", "#3ee8ff"], ["#c97b3f", "#a3232e", "#ffd54a"],
                  ["#6a9a7a", "#e8e0c8", "#8cff3a"], ["#d8cfb8", "#5b5763", "#ff7a2f"], ["#4a5fa8", "#e0b23c", "#b45cff"]];

    function drawMini(c, m, x, y, walking, t) {
      var stepping = walking && Math.floor(t * 6 + m.phase) % 2 === 0;
      var lift = stepping ? 1 : 0;
      for (var j = 0; j < MINI.length; j++) {
        var row = j === 8 && stepping ? STEP : MINI[j];
        for (var i = 0; i < 7; i++) {
          var ch = row[i];
          if (ch === ".") continue;
          var col = ch === "O" ? "#100e14" : ch === "M" ? m.p[0] : ch === "A" ? m.p[1] : m.p[2];
          px(c, col, x + i, y + j - lift);
        }
      }
    }

    // Three crews strung out up the slope, each a few bots close together.
    var crews = [
      { start: 22, n: 4 },
      { start: -8, n: 3 },
      { start: -34, n: 4 }
    ];
    var minis = [];
    var r = seeded(42);
    var order = 0;
    crews.forEach(function (crew, ci) {
      for (var k = 0; k < crew.n; k++) {
        minis.push({
          lead: crew.start - k * 7 - Math.floor(r() * 2),
          p: PLATES[Math.floor(r() * PLATES.length)],
          phase: r() * 2,
          speed: 8.5 + r() * 2,
          gap: 15 + order * 6 + ci * 5     // each crew bunches up, a little apart from the next
        });
        order++;
      }
    });

    var CYCLE = 12;

    function draw(c, t) {
      var tc = t % CYCLE;
      c.drawImage(bg, 0, 0);

      // Boss strides along the ridge, leading the way out.
      var bossX = 74 + Math.min(1, tc / 10) * 26;
      var bossBob = Math.round(Math.sin(t * 3));
      var bossEyes = !(Math.floor(t * 10) % 37 === 0);
      if (boss.complete && bossOff.complete) {
        c.drawImage(bossEyes ? boss : bossOff, Math.round(bossX) - 20, groundY(bossX) - 32 - bossBob);
      }

      // The crews climb, then bunch up behind the boss and watch it.
      minis.forEach(function (m) {
        var x = m.lead + tc * m.speed;
        var stop = bossX - m.gap;
        var walking = x < stop;
        if (!walking) x = stop;
        if (x < -7) return;
        var gx = Math.round(x);
        drawMini(c, m, gx, groundY(gx + 3) - 9, walking, t);
      });

      dim(c, tc > CYCLE - 0.8 ? (tc - (CYCLE - 0.8)) / 0.6 : tc < 0.4 ? 1 - tc / 0.4 : 0);
    }
    function start() { run(cv, draw, 9.5); }
    if (boss.complete && bossOff.complete) start();
    else { var n = 0; boss.onload = bossOff.onload = function () { if (++n === 2) start(); }; }
  })();
})();
