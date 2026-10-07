/*
 * Umka — all form logic in one place:
 *  - loads form fragments ([data-fragment]) via AJAX;
 *  - cleaning calculator (prices and rules ported 1:1 from cleaning-umka.ru);
 *  - quick order form in the hero (variant 5);
 *  - order / consultation modal (forms/order-form.html).
 */
(function () {
  'use strict';

  // Where to POST order requests. Empty = demo mode (nothing is sent).
  var FORM_ENDPOINT = '';
  var ORDER_FORM_URL = '../forms/order-form.html';

  /* ---------- Calculator data (from cleaning-umka.ru) ---------- */

  var CLEANING_PRICES = {
    maintenance: {
      '40': { price: 4000, time_hours: '2-3', cleaners: '1' },
      '50': { price: 4500, time_hours: '2-3', cleaners: '1' },
      '60': { price: 5200, time_hours: '2-3', cleaners: '1' },
      '70': { price: 5700, time_hours: '3-4', cleaners: '1' },
      '80': { price: 6300, time_hours: '3-4', cleaners: '1' },
      '90': { price: 6800, time_hours: '3-4', cleaners: '1' },
      '100': { price: 7300, time_hours: '4-5', cleaners: '1-2' },
      '101': { price_per_m2: 73, time_hours: '4-6', cleaners: '1-2' }
    },
    general: {
      '40': { price: 12000, time_hours: '5-6', cleaners: '2' },
      '50': { price: 13600, time_hours: '5-6', cleaners: '2' },
      '60': { price: 15600, time_hours: '5-6', cleaners: '2' },
      '70': { price: 17200, time_hours: '6-7', cleaners: '2-3' },
      '80': { price: 18800, time_hours: '6-7', cleaners: '2-3' },
      '90': { price: 20400, time_hours: '6-7', cleaners: '3' },
      '100': { price: 22000, time_hours: '7-8', cleaners: '3' },
      '101': { price_per_m2: 220, time_hours: '7-8', cleaners: '3' }
    },
    after_renovation_new: {
      '40': { price: 10800, time_hours: '5-6', cleaners: '2' },
      '50': { price: 12240, time_hours: '5-6', cleaners: '2' },
      '60': { price: 14040, time_hours: '5-6', cleaners: '2' },
      '70': { price: 15480, time_hours: '6-7', cleaners: '2-3' },
      '80': { price: 16920, time_hours: '6-7', cleaners: '2-3' },
      '90': { price: 18360, time_hours: '6-7', cleaners: '3' },
      '100': { price: 19800, time_hours: '7-8', cleaners: '3' },
      '101': { price_per_m2: 198, time_hours: '7-8', cleaners: '3' }
    },
    after_renovation_lived: {
      '40': { price: 12000, time_hours: '5-6', cleaners: '2' },
      '50': { price: 13600, time_hours: '5-6', cleaners: '2' },
      '60': { price: 15600, time_hours: '5-6', cleaners: '2' },
      '70': { price: 17200, time_hours: '6-7', cleaners: '2-3' },
      '80': { price: 18800, time_hours: '6-7', cleaners: '2-3' },
      '90': { price: 20400, time_hours: '6-7', cleaners: '3' },
      '100': { price: 22000, time_hours: '7-8', cleaners: '3' },
      '101': { price_per_m2: 220, time_hours: '7-8', cleaners: '3' }
    }
  };

  var TYPE_TABLE = {
    support: 'maintenance',
    general: 'general',
    postrenovation_new: 'after_renovation_new',
    postrenovation_lived: 'after_renovation_lived'
  };

  var TYPE_NAMES = {
    support: 'Поддерживающая',
    general: 'Генеральная',
    postrenovation_new: 'После ремонта (новая квартира)',
    postrenovation_lived: 'После ремонта (ранее жилая квартира)'
  };

  var WINDOW_PRICES = { smallMax: 1200, smallMin: 1000, bigPerM2: 300 };

  var DRY_PRICES = {
    curtains: 300, bed: 2000, mattress: 2500, carpet: 300,
    sofa: 5000, chair: 800, armchair: 2000, pillow: 500
  };

  var DRY_NAMES = {
    curtains: 'Шторы', bed: 'Кровать (изголовье+царги)', mattress: 'Матрас', carpet: 'Ковры/Ковролин',
    sofa: 'Диван', chair: 'Стулья/Офисные кресла', armchair: 'Кресло', pillow: 'Подушка'
  };

  // id of checkbox -> [data-count of quantity input, price per unit, name, unit]
  var EXTRAS_COUNTED = {
    hourlyCleaner: ['hourly-cleaner', 1500, 'Почасовая работа клинера', 'ч'],
    ironing: ['ironing', 1500, 'Глажка белья', 'ч'],
    fridge: ['fridge', 1500, 'Мойка холодильника', 'шт'],
    oven: ['oven', 1500, 'Мойка духовки', 'шт'],
    blinds: ['blinds', 400, 'Мойка жалюзи', 'шт'],
    chandelierSmall: ['chandelier-small', 1500, 'Мойка люстры до 50 см', 'шт'],
    chandelierBig: ['chandelier-big', 3000, 'Мойка люстры более 50 см', 'шт'],
    trash: ['trash', 6000, 'Вывоз мусора', 'м³']
  };

  // id of checkbox -> [share of base price, name]
  var EXTRAS_RATE = {
    animalHair: [0.15, 'Уборка шерсти животных'],
    vipCleaning: [0.5, 'VIP уборка'],
    nightCleaning: [1, 'Ночная уборка']
  };

  var CLEANING_INFO = {
    support: '<span>Поддерживающая уборка</span> <br>Средства: мягкие (Grass). <br><br>Инвентарь: ведро, таз, МОП, тряпки/губки/щетки, пылесос (при наличии у заказчика). <br><br>Что входит: <br>· Вся квартира: обеспыливание, мойка поверхностей, зеркал, полов с плинтусами, размещение вещей, смена белья, вынос мусора (до 2 пакетов). <br>· Кухня: мойка столешниц, фасадов, техники снаружи, микроволновки (внутри/снаружи), посуды (до 1 раковины), дезинфекция сантехники, локально стены. <br>· Санузел: сантехника, локально стены. <br><br>Не входит: окна, химчистка, люстры, &gt;50 предметов, следы герметика/краски, раскладка по закрытым шкафам без согласования, выше 2 м.',
    general: '<span>Генеральная уборка</span> <br>Средства: мягкие + сильные (Pro-Brite, Химитек, LAKMA, Dolphin). <br><br>Инвентарь: пылеводосос, парогенератор, стремянки, ведро, таз, МОП, тряпки/губки/щетки. <br><br>Что входит: <br>· Вся квартира: обеспыливание, удаление сложных загрязнений (налет, ржавчина, жир), протирка предметов интерьера, мойка люстры, кондиционера (снаружи+фильтры), зеркал, внутри и за мебелью (при отсутствии вещей), размещение вещей, смена белья, уборка пылесосом, мойка полов, вынос мусора (до 2 пакетов). <br>· Кухня: + мойка холодильника и духовки внутри. <br>· Санузел: полная мойка стен и потолка, межплиточные швы. <br><br>Не входит: окна, химчистка, хрустальные люстры, &gt;50 предметов, следы герметика/краски, раскладка по закрытым шкафам без согласования, отодвигание тяжелой мебели.',
    postrenovation_new: '<span>Уборка после ремонта</span> (новая квартира) <br>Средства: мягкие + сильные (Pro-Brite, Химитек, LAKMA, Dolphin). <br><br>Инвентарь: пылеводосос, парогенератор, стремянки, ведро, таз, МОП, тряпки/губки/щетки. <br><br>Что входит: <br>· Вся квартира: обеспыливание, удаление сложных загрязнений, очистка локальных следов цемента, клея, краски, скотча, мойка люстры, кондиционера (снаружи+фильтры), зеркал, внутри и за мебелью (при отсутствии вещей), размещение вещей, смена белья, уборка пылесосом, мойка полов, вынос мусора (до 2 пакетов). <br>· Кухня: + мойка холодильника и духовки внутри. <br>· Санузел: полная мойка стен и потолка, межплиточные швы, удаление затирки с плитки (кроме эпоксидной). <br><br>Не входит: окна, химчистка, хрустальные люстры, &gt;50 предметов, большие следы герметика/краски, раскладка по закрытым шкафам без согласования, отодвигание тяжелой мебели, крупный мусор и коробки.',
    postrenovation_lived: '<span>Уборка после ремонта</span> (ранее жилая квартира) <br>Средства: мягкие + сильные (Pro-Brite, Химитек, LAKMA, Dolphin). <br><br>Инвентарь: пылеводосос, парогенератор, стремянки, ведро, таз, МОП, тряпки/губки/щетки. <br><br>Что входит: <br>· Вся квартира: обеспыливание, удаление сложных загрязнений, очистка локальных следов цемента, клея, краски, скотча, мойка люстры, кондиционера (снаружи+фильтры), зеркал, внутри и за мебелью (при отсутствии вещей), размещение вещей, смена белья, уборка пылесосом, мойка полов, вынос мусора (до 2 пакетов). <br>· Кухня: + мойка холодильника и духовки внутри. <br>· Санузел: полная мойка стен и потолка, межплиточные швы, удаление затирки с плитки (кроме эпоксидной). <br><br>Не входит: окна, химчистка, хрустальные люстры, &gt;50 предметов, большие следы герметика/краски, раскладка по закрытым шкафам без согласования, отодвигание тяжелой мебели, крупный мусор и коробки.'
  };

  /* ---------- Helpers ---------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function toInt(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  function countInput(name) { return $('input.calc-input[data-count="' + name + '"]'); }

  function loadFragment(el) {
    return fetch(el.getAttribute('data-fragment'), { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) { el.innerHTML = html; el.removeAttribute('data-fragment'); })
      .catch(function () { el.textContent = 'Не удалось загрузить форму. Обновите страницу.'; });
  }

  /* ---------- Calculator ---------- */

  function selectedType() {
    var checked = $('input[name="cleaningType"]:checked');
    return checked ? checked.value : 'support';
  }

  function getBaseCleaning() {
    var table = CLEANING_PRICES[TYPE_TABLE[selectedType()]];
    var square = toInt($('#cleaningSquare').value);
    var key;
    if (square <= 40) key = '40';
    else if (square <= 50) key = '50';
    else if (square <= 60) key = '60';
    else if (square <= 70) key = '70';
    else if (square <= 80) key = '80';
    else if (square <= 90) key = '90';
    else if (square <= 100) key = '100';
    else key = '101';
    var data = table[key];
    return { price: data.price || square * data.price_per_m2, hours: data.time_hours, cleaners: data.cleaners, square: square };
  }

  function calculateWindows() {
    var small = toInt($('#smallWindow').value);
    var big = toInt($('#bigWindow').value);
    var price = 0;
    if (small > 0) price += small >= 10 ? small * WINDOW_PRICES.smallMin : small * WINDOW_PRICES.smallMax;
    if (big > 0) price += big * WINDOW_PRICES.bigPerM2;
    return price;
  }

  function calculateDryCleaning() {
    return $all('.calc-dry input[type=checkbox]').reduce(function (sum, cb) {
      return sum + (cb.checked && DRY_PRICES[cb.value] ? DRY_PRICES[cb.value] : 0);
    }, 0);
  }

  function calculateExtras(basePrice) {
    var price = 0;
    Object.keys(EXTRAS_COUNTED).forEach(function (id) {
      var cfg = EXTRAS_COUNTED[id];
      if ($('#' + id).checked) price += toInt(countInput(cfg[0]).value) * cfg[1];
    });
    Object.keys(EXTRAS_RATE).forEach(function (id) {
      if ($('#' + id).checked) price += basePrice * EXTRAS_RATE[id][0];
    });
    return price;
  }

  var lastResult = null;

  function setOut(name, value, asHtml) {
    $all('[data-out="' + name + '"]').forEach(function (el) {
      if (asHtml) el.innerHTML = value; else el.textContent = value;
    });
  }

  // What is chosen inside the collapsible sections, for the price block
  function collectSelection() {
    var groups = [];
    var small = toInt($('#smallWindow').value), big = toInt($('#bigWindow').value);
    var windows = [];
    if (small > 0) windows.push('до 4 м² — ' + small + ' шт');
    if (big > 0) windows.push('больше 4 м² — ' + big + ' м²');
    if (windows.length) groups.push({ id: 'calcWindows', title: 'Окна', items: windows });

    var dry = $all('.calc-dry input[type=checkbox]').filter(function (cb) { return cb.checked; })
      .map(function (cb) { return DRY_NAMES[cb.value]; });
    if (dry.length) groups.push({ id: 'calcDry', title: 'Химчистка', items: dry });

    var extras = [];
    Object.keys(EXTRAS_COUNTED).forEach(function (id) {
      var cfg = EXTRAS_COUNTED[id], qty = toInt(countInput(cfg[0]).value);
      if ($('#' + id).checked && qty > 0) extras.push(cfg[2] + ' — ' + qty + ' ' + cfg[3]);
    });
    Object.keys(EXTRAS_RATE).forEach(function (id) {
      if ($('#' + id).checked) extras.push(EXTRAS_RATE[id][1]);
    });
    if (extras.length) groups.push({ id: 'calcExtra', title: 'Дополнительно', items: extras });
    return groups;
  }

  function renderSelection() {
    var groups = collectSelection();
    $all('[data-selection]').forEach(function (box) {
      var list = $('[data-out="selection"]', box);
      list.textContent = '';
      groups.forEach(function (g) {
        var li = document.createElement('li');
        var name = document.createElement('span');
        name.textContent = g.title;
        li.appendChild(name);
        var values = document.createElement('b');
        g.items.forEach(function (text, i) {
          if (i) values.appendChild(document.createElement('br'));
          values.appendChild(document.createTextNode(text));
        });
        li.appendChild(values);
        list.appendChild(li);
      });
      box.hidden = !groups.length;
    });
    // counters on the section headers / tabs
    ['calcWindows', 'calcDry', 'calcExtra'].forEach(function (id) {
      var g = groups.filter(function (x) { return x.id === id; })[0];
      $all('[data-badge="' + id + '"]').forEach(function (b) {
        b.textContent = g ? g.items.length : '';
        b.hidden = !g;
      });
    });
  }

  function calculate() {
    if (!$('#cleaningSquare')) return;
    var base = getBaseCleaning();
    var total = Math.round(base.price + calculateWindows() + calculateDryCleaning() + calculateExtras(base.price));
    var type = selectedType();
    lastResult = { total: total, base: base, type: type };
    setOut('price', total);
    setOut('hours', base.hours);
    setOut('workers', base.cleaners);
    setOut('square', base.square);
    setOut('type', TYPE_NAMES[type]);
    setOut('info', CLEANING_INFO[type] || 'Информация о выбранном типе уборки временно недоступна.', true);
    $all('input[name="cleaningType"]').forEach(function (r) {
      r.closest('label').classList.toggle('on', r.checked);
    });
    renderSelection();
    syncQuickForm();
  }

  function describeCalculation() {
    if (!lastResult) return '';
    var lines = [];
    lines.push('Площадь квартиры - ' + lastResult.base.square + ' м²');
    lines.push('Тип уборки - ' + TYPE_NAMES[lastResult.type]);
    var small = toInt($('#smallWindow').value), big = toInt($('#bigWindow').value);
    if (small > 0) lines.push('Окна маленькие - ' + small + ' шт');
    if (big > 0) lines.push('Окна большие - ' + big + ' м²');
    var dry = $all('.calc-dry input[type=checkbox]').filter(function (cb) { return cb.checked; })
      .map(function (cb) { return DRY_NAMES[cb.value]; });
    if (dry.length) lines.push('Химчистка - ' + dry.join(', '));
    Object.keys(EXTRAS_COUNTED).forEach(function (id) {
      var cfg = EXTRAS_COUNTED[id], qty = toInt(countInput(cfg[0]).value);
      if ($('#' + id).checked && qty > 0) lines.push(cfg[2] + ' - ' + qty + ' ' + cfg[3]);
    });
    Object.keys(EXTRAS_RATE).forEach(function (id) {
      if ($('#' + id).checked) lines.push(EXTRAS_RATE[id][1]);
    });
    lines.push('Итого: ' + lastResult.total + ' ₽');
    return lines.join(';\n');
  }

  function stepCounter(button) {
    var name = button.getAttribute('data-count');
    var input = countInput(name);
    if (!input) return;
    var value = toInt(input.value);
    var min = toInt(input.min);
    if (button.classList.contains('calc-plus')) {
      value++;
    } else {
      value--;
      // big windows: below the 4 m² minimum the field resets to zero (as on the site)
      if (name === 'big-window') {
        if (toInt(input.value) <= 4) { input.value = 0; afterCounterChange(input); return; }
      }
    }
    if (value < min) value = min;
    input.value = value;
    afterCounterChange(input);
  }

  function afterCounterChange(input) {
    // a quantity above zero switches its extra service on
    var row = input.closest('.ext-row');
    if (row) {
      var cb = $('input[type=checkbox]', row);
      if (cb) cb.checked = toInt(input.value) > 0;
    }
    calculate();
  }

  function initCalculator(root) {
    root.addEventListener('click', function (e) {
      var stepBtn = e.target.closest('.calc-plus, .calc-minus');
      if (stepBtn) { stepCounter(stepBtn); return; }

      var acc = e.target.closest('[data-acc]');
      if (acc) {
        var panel = document.getElementById(acc.getAttribute('aria-controls'));
        var open = acc.getAttribute('aria-expanded') !== 'true';
        acc.setAttribute('aria-expanded', open);
        panel.hidden = !open;
        var x = $('.acc-x', acc); if (x) x.textContent = open ? '−' : '+';
        return;
      }

      var tab = e.target.closest('[data-tab]');
      if (tab) {
        $all('[data-tab]', root).forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('on', on);
          t.setAttribute('aria-selected', on);
          document.getElementById(t.getAttribute('data-tab')).hidden = !on;
        });
        return;
      }

      var info = e.target.closest('.info-toggle');
      if (info) {
        var box = document.getElementById(info.getAttribute('aria-controls'));
        var show = box.hidden;
        box.hidden = !show;
        info.setAttribute('aria-expanded', show);
      }
    });

    root.addEventListener('input', function (e) {
      if (e.target.matches('.ext-row input.calc-input')) afterCounterChange(e.target);
      else calculate();
    });
    root.addEventListener('change', calculate);
    calculate();
  }

  /* ---------- Quick form (hero, variant 5) ---------- */

  var syncing = false;

  function syncQuickForm() {
    var form = $('[data-quick-form]');
    if (!form || syncing) return;
    var sq = $('[data-quick="square"]', form), type = $('[data-quick="type"]', form);
    if (document.activeElement !== sq) sq.value = $('#cleaningSquare').value;
    type.value = selectedType();
  }

  function initQuickForm(form) {
    function push() {
      var calcSquare = $('#cleaningSquare');
      if (!calcSquare) return;
      syncing = true;
      var sq = toInt($('[data-quick="square"]', form).value);
      if (sq >= 1) calcSquare.value = sq;
      var radio = $('input[name="cleaningType"][value="' + $('[data-quick="type"]', form).value + '"]');
      if (radio) radio.checked = true;
      calculate();
      syncing = false;
    }
    form.addEventListener('input', push);
    form.addEventListener('change', push);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      push();
      openOrder('calc');
    });
  }

  /* ---------- Order modal ---------- */

  var modal = null;
  var lastFocus = null;

  function ensureModal() {
    if (modal) return Promise.resolve(modal);
    var holder = document.createElement('div');
    holder.setAttribute('data-fragment', ORDER_FORM_URL);
    document.body.appendChild(holder);
    return loadFragment(holder).then(function () {
      modal = $('#orderModal');
      if (!modal) throw new Error('order form missing');
      initOrderForm();
      return modal;
    });
  }

  function openOrder(kind) {
    lastFocus = document.activeElement;
    ensureModal().then(function (m) {
      var title = kind === 'consult' ? 'Консультация' : 'Заказать клининг';
      $('#orderTitle', m).textContent = title;
      var details = kind === 'calc' ? describeCalculation() : '';
      var form = $('#orderForm', m);
      form.elements.details.value = (kind === 'consult' ? 'Консультация' : 'Заказ клининга') + (details ? ';\n' + details : '');
      var box = $('[data-order-details]', m);
      box.textContent = details;
      box.hidden = !details;
      $('.order-status', m).textContent = '';
      $('.order-status', m).className = 'order-status';
      m.hidden = false;
      document.body.classList.add('order-open');
      setTimeout(function () { form.elements.phone.focus(); }, 30);
    }).catch(function () {
      window.location.href = 'tel:+79150158877';
    });
  }

  function closeOrder() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('order-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initOrderForm() {
    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-order-close]')) closeOrder();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && !modal.hidden) closeOrder();
    });
    var form = $('#orderForm', modal);
    var status = $('.order-status', modal);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var phone = form.elements.phone;
      var digits = phone.value.replace(/\D/g, '');
      phone.setAttribute('aria-invalid', digits.length < 10);
      if (digits.length < 10) { status.textContent = 'Укажите телефон, чтобы мы могли перезвонить.'; status.className = 'order-status is-error'; phone.focus(); return; }
      if (!form.elements.agree.checked) { status.textContent = 'Нужно согласие на обработку персональных данных.'; status.className = 'order-status is-error'; return; }
      if (!FORM_ENDPOINT) {
        status.textContent = 'Демо-версия: заявка не отправляется. На сайте её получит менеджер.';
        status.className = 'order-status is-ok';
        return;
      }
      var button = $('.order-submit', form);
      button.disabled = true;
      fetch(FORM_ENDPOINT, { method: 'POST', body: new FormData(form) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); })
        .then(function () { status.textContent = 'Спасибо! Менеджер скоро перезвонит.'; status.className = 'order-status is-ok'; form.reset(); })
        .catch(function () { status.textContent = 'Не получилось отправить. Позвоните нам: +7 (915) 015-88-77.'; status.className = 'order-status is-error'; })
        .then(function () { button.disabled = false; });
    });
  }

  /* ---------- Init ---------- */

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-order]');
    if (!trigger) return;
    e.preventDefault();
    openOrder(trigger.getAttribute('data-order'));
  });

  Promise.all($all('[data-fragment]').map(loadFragment)).then(function () {
    var calc = $('[data-calc]');
    if (calc) initCalculator(calc);
    var quick = $('[data-quick-form]');
    if (quick) initQuickForm(quick);
    syncQuickForm();
  });
})();
