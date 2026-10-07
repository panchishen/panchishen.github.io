/* Umka — design version switcher (bottom-left corner). */
(function () {
  'use strict';

  var VERSIONS = [
    { id: 'v1', label: 'Вариант 1' },
    { id: 'v2', label: 'Вариант 2' }
  ];
  var STORAGE_KEY = 'umka-version';

  var current = document.body.getAttribute('data-version');

  function remember(id) {
    try { localStorage.setItem(STORAGE_KEY, id); } catch (e) { /* storage unavailable */ }
  }

  if (current) remember(current);

  var nav = document.createElement('nav');
  nav.className = 'version-switcher';
  nav.setAttribute('aria-label', 'Версия дизайна');

  VERSIONS.forEach(function (v) {
    var link = document.createElement('a');
    link.className = 'version-switcher__link';
    link.href = '../' + v.id + '/' + window.location.hash;
    link.textContent = v.label;
    if (v.id === current) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('is-active');
    }
    link.addEventListener('click', function () { remember(v.id); });
    nav.appendChild(link);
  });

  document.body.appendChild(nav);
})();
