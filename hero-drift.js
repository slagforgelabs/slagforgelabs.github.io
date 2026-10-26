/* Hero plate drift.
 *
 * The banner plate travels against the scroll while the banner is on screen, so
 * the crop moves slower than the page instead of sitting flat behind the title.
 * CSS view timelines can do this with no script at all, but the drift has to be
 * visible in every engine we are read in, so it is applied here instead.
 *
 * No network requests, no dependencies, one listener. If this file is missing
 * or scripting is off, the banner simply rests centred.
 */
(function () {
  var plates = document.querySelectorAll('.post-hero > img');
  if (!plates.length) return;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* Total travel, as a percentage of the plate's own height. The plate is sized
     at 140% of the banner with 20% of that overhanging above and below, so half
     of this figure must stay under 20. */
  var TRAVEL = 20;
  var queued = false;

  function paint() {
    queued = false;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;

    for (var i = 0; i < plates.length; i++) {
      var plate = plates[i];
      var banner = plate.parentNode;
      var box = banner.getBoundingClientRect();

      /* Document position of the banner's bottom edge. */
      var floor = box.bottom + y;
      if (floor < 1) floor = 1;

      /* 0 at the top of the page, 1 once the banner has scrolled clear. */
      var p = y / floor;
      if (p < 0) p = 0;
      if (p > 1) p = 1;

      plate.style.transform = 'translate3d(0,' + ((p - 0.5) * TRAVEL).toFixed(3) + '%,0)';
    }
  }

  function queue() {
    if (!queued) {
      queued = true;
      window.requestAnimationFrame(paint);
    }
  }

  paint();
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
})();