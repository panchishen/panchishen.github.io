/* Umka — sticky header: marks the page as scrolled so the header gets its shadow. */
(function () {
  'use strict';

  var header = document.querySelector('.p > header');
  if (!header) return;
  header.classList.add('site-header');

  var html = document.documentElement;
  var ticking = false;

  function update() {
    html.classList.toggle('is-scrolled', header.getBoundingClientRect().top <= 0 && window.scrollY > 0);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();
