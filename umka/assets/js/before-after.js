/* Umka — interactive before/after comparison for the «Примеры наших работ» block. */
(function () {
  'use strict';

  function setPosition(slider, value) {
    var pos = Math.max(0, Math.min(100, Number(value)));
    slider.style.setProperty('--ba-pos', pos + '%');
  }

  function enhance(box) {
    var before = box.querySelector('img.hl');
    var after = box.querySelector('img.hr');
    if (!before || !after) return;

    before.classList.remove('hl');
    before.classList.add('ba-before');
    after.classList.remove('hr');
    after.classList.add('ba-after');
    // the «before» shot is drawn above the «after» one and clipped by the handle
    box.insertBefore(after, before);

    var line = box.querySelector('.split, .ln');
    var handle = box.querySelector('.knob, .kn');
    if (line) line.classList.add('ba-line');
    if (handle) {
      handle.classList.add('ba-handle');
      handle.setAttribute('aria-hidden', 'true');
    }

    var range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = '100';
    range.step = '1';
    range.value = '50';
    range.className = 'ba-range';
    range.setAttribute('aria-label', 'Сравнение: до и после уборки');
    range.addEventListener('input', function () { setPosition(box, range.value); });
    box.appendChild(range);

    box.classList.add('ba-slider');
    setPosition(box, 50);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.ba .ph'), enhance);
})();
