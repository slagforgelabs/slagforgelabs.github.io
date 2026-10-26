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

  // Margin strays, wide screens only (CSS hides them otherwise).
  // One per side, so they never crowd each other.
  var sides = Math.random() < 0.5 ? ["left", "right"] : ["right", "left"];
  var count = Math.random() < 0.4 ? 1 : 2;
  for (var m = 0; m < count; m++) {
    var bot = makeBot(ids[m], rand(7, 10));
    bot.classList.add("stray-margin");
    bot.style[sides[m]] = "calc(" + -rand(11, 16).toFixed(1) + "rem)";
    bot.style.top = rand(m ? 45 : 18, m ? 80 : 45).toFixed(1) + "%";
    main.appendChild(bot);
  }

  // One more sitting on the footer line.
  var footer = main.querySelector("footer");
  if (footer) {
    var sitter = makeBot(ids[2], 4.5);
    sitter.classList.add("stray-sitter");
    sitter.style.left = rand(8, 78).toFixed(1) + "%";
    footer.appendChild(sitter);
  }
})();
