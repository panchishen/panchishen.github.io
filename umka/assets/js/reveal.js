/*
 * Umka — staggered reveal of page sections on scroll (marketing page, fires once).
 * Each section's headings, text and cards fade up one after another.
 * Content stays visible without JS: hiding starts only after this script adds .reveal-on.
 */
(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) return;

  var MAX_STEPS = 8;  // stagger step is 60ms (see reveal.css); later items don't wait longer

  // A container whose children are shown as a row of cards
  function isGroup(el) {
    var d = getComputedStyle(el).display;
    return (d === 'grid' || d === 'flex') && el.children.length >= 3 &&
      !el.matches('.calc, .calc-slot, .qc-slot, form, nav, .faq');
  }

  function targetsOf(section) {
    var root = section.querySelector(':scope > .w') || section;
    var out = [];
    Array.prototype.forEach.call(root.children, function (child) {
      if (getComputedStyle(child).position === 'absolute') return;
      if (isGroup(child)) {
        Array.prototype.forEach.call(child.children, function (c) { out.push(c); });
      } else {
        out.push(child);
      }
    });
    return out;
  }

  function finish(e) {
    // hand the element back to its own styles (hover transitions etc.)
    if (e.target !== e.currentTarget || e.propertyName !== 'opacity') return;
    e.currentTarget.classList.remove('reveal-item', 'is-in');
    e.currentTarget.style.removeProperty('--reveal-i');
    e.currentTarget.removeEventListener('transitionend', finish);
  }

  var sections = Array.prototype.slice.call(document.querySelectorAll('.p > section, .p > footer'));
  if (!sections.length) return;

  document.documentElement.classList.add('reveal-on');

  sections.forEach(function (section) {
    targetsOf(section).forEach(function (el, i) {
      el.classList.add('reveal-item');
      el.style.setProperty('--reveal-i', Math.min(i, MAX_STEPS));
      el.addEventListener('transitionend', finish);
    });
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      Array.prototype.forEach.call(entry.target.querySelectorAll('.reveal-item'), function (el) {
        el.classList.add('is-in');
      });
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

  sections.forEach(function (s) { observer.observe(s); });

  // safety net: never leave content hidden (e.g. printing, odd viewports)
  window.addEventListener('beforeprint', function () {
    document.documentElement.classList.remove('reveal-on');
  });
})();
