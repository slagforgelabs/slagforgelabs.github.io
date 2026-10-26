/* Stray Slagbots.
 *
 * A few random Slagbots from the pool in images/slagbots/strays wander onto
 * every page: one or two floating in the side margins on wide screens, and
 * one sitting on the footer rule at any size. A different crew each visit.
 * They float and blink like the other bots on the site (see .bot in
 * styles.css), and stay still for visitors who prefer reduced motion.
 */
(function () {
  "use strict";

  var POOL = 12;
  var script = document.currentScript;
  var base = script ? script.src.replace(/stray-bots\.js.*$/, "") : "/";
  var main = document.querySelector("main");
  if (!main) return;

  // Shuffle the pool so no bot turns up twice on one page.
  var ids = [];
  for (var i = 1; i <= POOL; i++) ids.push(i);
  for (var j = ids.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var t = ids[j]; ids[j] = ids[k]; ids[k] = t;
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeBot(id, sizeRem) {
    var n = (id < 10 ? "0" : "") + id;
    var span = document.createElement("span");
    span.className = "bot stray-bot";
    span.setAttribute("aria-hidden", "true");
    span.style.width = sizeRem + "rem";
    span.style.animationDelay = (-rand(0, 3.2)).toFixed(2) + "s";
    span.style.animationDuration = rand(2.8, 4).toFixed(2) + "s";

    var img = document.createElement("img");
    img.src = base + "images/slagbots/strays/stray-" + n + ".png";
    img.alt = "";
    img.width = 40; img.height = 40;

    var blink = document.createElement("img");
    blink.className = "bot-blink";
    blink.src = base + "images/slagbots/strays/stray-" + n + "-blink.png";
    blink.alt = "";
    blink.width = 40; blink.height = 40;
    blink.style.animationDuration = rand(4.5, 7.5).toFixed(2) + "s";
    blink.style.animationDelay = (-rand(0, 6)).toFixed(2) + "s";

    span.appendChild(img);
    span.appendChild(blink);
    return span;
  }

  // Placement lives here, inline, so a stale cached stylesheet can never drop
  // the bots into the page flow and stretch it.
  var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  var footer = main.querySelector("footer");

  // Margin strays: one per side so they never crowd each other. Each gets a
  // band of the page (upper or lower) so they don't line up, and a spot that
  // stays clear of the text column and inside the window.
  var sides = Math.random() < 0.5 ? ["left", "right"] : ["right", "left"];
  var count = Math.random() < 0.4 ? 1 : 2;
  var strays = [];
  for (var m = 0; m < count; m++) {
    var size = rand(6, 8.5);
    var bot = makeBot(ids[m], size);
    bot.classList.add("stray-margin");
    bot.style.position = "absolute";
    bot.style.display = "none";
    main.appendChild(bot);
    strays.push({
      el: bot,
      side: sides[m],
      sizePx: size * rem,
      gap: rand(2.5, 6) * rem,        // clear space between text and bot
      band: m === 0 ? [0.2, 0.5] : [0.5, 0.85],
      pick: Math.random()
    });
  }

  function place() {
    var mainW = main.offsetWidth;
    var gutter = (document.documentElement.clientWidth - mainW) / 2;
    var bottom = (footer ? footer.offsetTop : main.offsetHeight) - 2 * rem;
    var top = 14 * rem;                    // below the nav and logo
    strays.forEach(function (s) {
      var room = gutter - s.gap - s.sizePx - rem;  // keep 1rem off the window edge
      var lo = top + (bottom - top) * s.band[0];
      var hi = Math.min(top + (bottom - top) * s.band[1], bottom - s.sizePx);
      if (room < 0 || hi <= lo) { s.el.style.display = "none"; return; }
      s.el.style.display = "inline-block";
      s.el.style.top = Math.round(lo + (hi - lo) * s.pick) + "px";
      s.el.style.left = s.el.style.right = "";
      s.el.style[s.side] = -Math.round(s.gap + s.sizePx + room * s.pick * 0.6) + "px";
    });
  }
  place();
  window.addEventListener("resize", place);
  window.addEventListener("load", place);
  main.addEventListener("toggle", place, true);   // sections opening and closing

  // One more sitting on the footer line.
  if (footer) {
    var sitterRem = 4.5;
    var sitter = makeBot(ids[2], sitterRem);
    sitter.classList.add("stray-sitter");
    if (getComputedStyle(footer).position === "static") footer.style.position = "relative";
    footer.style.marginTop = "6rem";   // room for the bot above the footer
    sitter.style.position = "absolute";
    sitter.style.bottom = "100%";
    sitter.style.marginBottom = -(sitterRem * 6 / 40) + "rem";  // six empty rows under its feet
    sitter.style.left = rand(8, 78).toFixed(1) + "%";
    footer.appendChild(sitter);
  }
})();
