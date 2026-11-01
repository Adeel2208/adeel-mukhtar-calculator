/* FairShare screen logic: keeps the state, checks the inputs and draws the result. */
(function () {
  'use strict';

  const F = window.FairShare;
  const $ = (id) => document.getElementById(id);
  const MAX_PEOPLE = 100;
  const MAX_DINERS = 20;
  const MAX_ITEMS = 50;
  const UNDO_MS = 10000;
  const COPIED_MS = 2000;

  /* ---------- State ---------- */

  function initialState() {
    return {
      mode: 'even',
      subtotal: '', subtotalTouched: false, count: '2', roundUp: false,
      tax: '', tipPreset: 1500, tipCustom: '',
      diners: [{ id: 1, name: 'Person 1' }, { id: 2, name: 'Person 2' }],
      items: [],
      receipt: '',
      nextId: 3
    };
  }
  let state = initialState();

  const withoutIds = (s) => JSON.stringify(s, (k, v) => (k === 'id' || k === 'nextId' ? undefined : v));
  const isStartingState = () => withoutIds(state) === withoutIds(initialState());

  /* ---------- Helpers ---------- */

  /* Small DOM builder: attributes, plus text/value/checked set as properties. */
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'text') node.textContent = v;
      else if (k === 'value' || k === 'checked') node[k] = v;
      else node.setAttribute(k, v);
    }
    node.append(...children);
    return node;
  }

  const dinerName = (p, i) => p.name.trim() || 'Person ' + (i + 1);
  const findById = (list, node) => list.find((x) => x.id === Number(node.closest('[data-id]').dataset.id));

  /* Shows or clears the message under a field. Returns true when the field has an error. */
  function setError(id, message) {
    const field = $(id);
    $(id + '-error').textContent = message || '';
    field.classList.toggle('invalid', !!message);
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !!message;
  }

  /* Shows one result view ('even' or 'item') with its copyable breakdown, or a message instead. */
  let breakdown = '';
  function show(view, message, text) {
    $('result-message').textContent = message || '';
    $('result-message').hidden = !message;
    $('even-result').hidden = view !== 'even';
    $('item-result').hidden = view !== 'item';
    if ((text || '') === breakdown) return;
    breakdown = text || '';
    $('copy').disabled = !breakdown;
    $('copy-error').textContent = '';
    $('copy-text').hidden = true;
  }

  /* ---------- Checking inputs and drawing the result ---------- */

  function update() {
    const tax = F.parseTax(state.tax);
    const tip = state.tipPreset !== null ? { value: state.tipPreset } : F.parseTip(state.tipCustom);
    let invalid = setError('tax', tax.error);
    invalid = setError('tip-custom', tip.error) || invalid;
    document.querySelectorAll('.tip-preset').forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.tip) === state.tipPreset));
    });
    $('start-over').disabled = isStartingState();
    if (state.mode === 'even') updateEven(invalid, tax, tip);
    else updateItems(invalid, tax, tip);
  }

  function updateEven(invalid, tax, tip) {
    const subtotal = F.parseSubtotal(state.subtotal);
    const people = F.parsePeople(state.count);
    const waiting = subtotal.empty && !state.subtotalTouched;
    invalid = setError('subtotal', waiting ? '' : subtotal.error) || invalid;
    invalid = setError('people', people.error) || invalid;

    const n = Number(state.count.trim());
    $('people-down').disabled = !(n > 1);
    $('people-up').disabled = n >= MAX_PEOPLE;

    if (invalid) return show(null, F.MSG.fix);
    if (waiting) return show(null, F.MSG.enterSubtotal);

    const r = F.calculateEven({ subtotal: subtotal.value, tax: tax.value, tip: tip.value, people: people.value, roundUp: state.roundUp });
    $('out-subtotal').textContent = F.formatMoney(r.subtotal);
    $('out-tax').textContent = F.formatMoney(r.tax);
    $('out-tip-label').textContent = 'Tip (' + F.formatPercent(tip.value) + (r.extra ? ' + rounding)' : ')');
    $('out-tip').textContent = F.formatMoney(r.tip);
    $('out-total').textContent = F.formatMoney(r.total);
    $('shares').textContent = F.describeShares(r.shares);
    $('shares-note').textContent = r.extra
      ? 'The extra ' + F.formatMoney(r.extra) + ' is added to the tip.' : F.sharesNote(r.shares, r.total);
    trackPaid(r.shares);
    renderTipTable(F.compareTips({ subtotal: subtotal.value, tax: tax.value, people: people.value, selected: tip.value }), tip.value);
    show('even', '', F.evenBreakdown(r, tip.value));
  }

  function renderTipTable(rows, selected) {
    const perPerson = (row) => F.formatMoney(row.low) + (row.high === row.low ? '' : '–' + F.formatMoney(row.high));
    $('tip-table').tBodies[0].replaceChildren(...rows.map((row) => {
      const pct = F.formatPercent(row.rate);
      const on = row.rate === selected;
      return el('tr', { class: on ? 'selected' : '', 'data-rate': row.rate },
        el('th', { scope: 'row' },
          el('button', { type: 'button', class: 'pick', 'aria-pressed': String(on), 'aria-label': 'Use ' + pct + ' tip', text: pct })),
        el('td', { text: F.formatMoney(row.tip) }),
        el('td', { text: F.formatMoney(row.total) }),
        el('td', { text: perPerson(row) }));
    }));
  }

  function updateItems(invalid, tax, tip) {
    const nameErrors = F.checkNames(state.diners.map((p) => p.name));
    state.diners.forEach((p, i) => { invalid = setError('name-' + p.id, nameErrors[i]) || invalid; });

    const items = state.items.map((item) => {
      const price = F.parsePrice(item.price);
      const who = state.diners.flatMap((p, i) => (item.who.includes(p.id) ? [i] : []));
      invalid = setError('price-' + item.id, price.error) || invalid;
      invalid = setError('who-' + item.id, who.length ? '' : F.MSG.chooseWho) || invalid;
      return { price: price.value, who };
    });

    // Optional receipt subtotal (S-11); empty means no check.
    const receipt = state.receipt.trim() ? F.parseSubtotal(state.receipt) : {};
    invalid = setError('receipt', receipt.error) || invalid;
    const pricesOk = items.length > 0 && items.every((item) => item.price !== undefined);
    $('receipt-check').textContent = receipt.value && pricesOk
      ? F.receiptCheck(items.reduce((a, item) => a + item.price, 0), receipt.value) : '';

    const fullDiners = state.diners.length >= MAX_DINERS;
    const fullItems = state.items.length >= MAX_ITEMS;
    $('add-person').disabled = fullDiners;
    $('add-person-limit').textContent = fullDiners ? F.MSG.maxDiners : '';
    $('add-item').disabled = fullItems;
    $('add-item-limit').textContent = fullItems ? F.MSG.maxItems : '';
    document.querySelectorAll('.remove-person').forEach((b) => { b.disabled = state.diners.length === 1; });

    if (invalid) return show(null, F.MSG.fix);
    if (!items.length) return show(null, F.MSG.addItem);

    const r = F.calculateItems({ people: state.diners.length, items, tax: tax.value, tip: tip.value });
    const money = (row) => [row.items, row.tax, row.tip, row.total].map((c) => el('td', { text: F.formatMoney(c) }));
    $('person-table').tBodies[0].replaceChildren(...r.rows.map((row, i) =>
      el('tr', {}, el('th', { scope: 'row', text: dinerName(state.diners[i], i) }), ...money(row))));
    $('person-table').tFoot.replaceChildren(el('tr', {}, el('th', { scope: 'row', text: 'Total' }),
      ...money({ items: r.subtotal, tax: r.tax, tip: r.tip, total: r.total })));
    show('item', '', F.itemBreakdown(r, tip.value, state.diners.map(dinerName)));
  }

  /* ---------- Who has paid (S-13). Kept outside the state: ticks are not part of the bill. ---------- */

  let paid = new Set();
  let paidShares = [];
  let paidFor = '';

  /* Redraws the list only when the shares change, clearing any ticks (AC 13.3). */
  function trackPaid(shares) {
    const key = shares.join();
    if (key === paidFor) return;
    $('paid-cleared').textContent = paid.size ? 'Amounts changed, so paid ticks were cleared.' : '';
    paid = new Set();
    paidShares = shares;
    paidFor = key;
    $('paid-list').replaceChildren(...shares.map((cents, i) => el('li', {},
      el('label', { class: 'paid-row' },
        el('input', { type: 'checkbox', 'data-i': i, 'aria-label': 'Person ' + (i + 1) + ' has paid' }),
        el('span', { text: 'Person ' + (i + 1) }),
        el('span', { class: 'amount', text: F.formatMoney(cents) })))));
    paidStatus();
  }

  function paidStatus() {
    const owed = paidShares.reduce((a, cents, i) => a + (paid.has(i) ? 0 : cents), 0);
    $('paid-status').textContent = paid.size === paidShares.length ? 'Everyone has paid.' : 'Still to collect: ' + F.formatMoney(owed);
  }

  function resetPaid() {
    paid = new Set();
    paidFor = '';
    $('paid-cleared').textContent = '';
  }

  /* ---------- People and items lists ---------- */

  function renderDiners() {
    $('diners').replaceChildren(...state.diners.map((p, i) => el('li', { 'data-id': p.id },
      el('div', { class: 'row' },
        el('div', { class: 'input' },
          el('label', { class: 'sr-only', for: 'name-' + p.id, text: 'Name of person ' + (i + 1) }),
          el('input', { id: 'name-' + p.id, class: 'person-name', maxlength: 30, value: p.name, 'aria-describedby': 'name-' + p.id + '-error' })),
        el('button', { type: 'button', class: 'remove remove-person', 'aria-label': 'Remove ' + dinerName(p, i), text: 'Remove' })),
      el('p', { class: 'error', id: 'name-' + p.id + '-error', 'aria-live': 'polite' }))));
  }

  function renderItems() {
    $('items').replaceChildren(...state.items.map((item, i) => {
      const id = item.id;
      return el('li', { class: 'item', 'data-id': id },
        el('div', { class: 'row' },
          el('div', { class: 'input item-name-box' },
            el('label', { class: 'sr-only', for: 'item-name-' + id, text: 'Name of item ' + (i + 1) }),
            el('input', { id: 'item-name-' + id, class: 'item-name', maxlength: 40, placeholder: 'Item ' + (i + 1), value: item.name })),
          el('div', { class: 'input money price' },
            el('span', { 'aria-hidden': 'true', text: '$' }),
            el('label', { class: 'sr-only', for: 'price-' + id, text: 'Price of item ' + (i + 1) }),
            el('input', { id: 'price-' + id, class: 'item-price', inputmode: 'decimal', placeholder: '0.00', value: item.price, 'aria-describedby': 'price-' + id + '-error' })),
          el('button', { type: 'button', class: 'remove remove-item', 'aria-label': 'Remove item ' + (i + 1), text: 'Remove' })),
        el('p', { class: 'error', id: 'price-' + id + '-error', 'aria-live': 'polite' }),
        el('fieldset', { class: 'who', id: 'who-' + id, 'aria-describedby': 'who-' + id + '-error' },
          el('legend', { text: 'Who had it?' }),
          ...state.diners.map((p, j) => el('label', { class: 'chip' },
            el('input', { type: 'checkbox', class: 'who-box', 'data-person': p.id, checked: item.who.includes(p.id) }),
            el('span', { class: 'who-name', 'data-person': p.id, text: dinerName(p, j) }))),
          el('button', { type: 'button', class: 'everyone', text: 'Everyone' })),
        el('p', { class: 'error', id: 'who-' + id + '-error', 'aria-live': 'polite' }));
    }));
  }

  /* After a rename: refresh the names shown next to checkboxes and on Remove buttons. */
  function refreshNames() {
    state.diners.forEach((p, i) => {
      document.querySelectorAll('.who-name[data-person="' + p.id + '"]').forEach((s) => { s.textContent = dinerName(p, i); });
      $('name-' + p.id).closest('li').querySelector('.remove-person').setAttribute('aria-label', 'Remove ' + dinerName(p, i));
    });
  }

  function syncMode() {
    for (const mode of ['even', 'item']) {
      const on = state.mode === mode;
      $('tab-' + mode).setAttribute('aria-selected', String(on));
      $('tab-' + mode).tabIndex = on ? 0 : -1;
      $('panel-' + mode).hidden = !on;
    }
  }

  /* Draws every input from the state (on load, after Start over and after Undo). */
  function render() {
    $('subtotal').value = state.subtotal;
    $('people').value = state.count;
    $('round-up').checked = state.roundUp;
    $('tax').value = state.tax;
    $('receipt').value = state.receipt;
    $('tip-custom').value = state.tipCustom;
    renderDiners();
    renderItems();
    syncMode();
    update();
  }

  /* ---------- Events: tabs ---------- */

  function setMode(mode) {
    state.mode = mode;
    syncMode();
    update();
  }

  $('tab-even').addEventListener('click', () => setMode('even'));
  $('tab-item').addEventListener('click', () => setMode('item'));
  document.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = state.mode === 'even' ? 'item' : 'even';
    setMode(next);
    $('tab-' + next).focus();
  });

  /* ---------- Events: text fields, people stepper, tip and round-up ---------- */

  function bindText(id, key, after) {
    $(id).addEventListener('input', (e) => {
      state[key] = e.target.value;
      if (after) after(e.target.value);
      update();
    });
  }

  bindText('subtotal', 'subtotal', () => { state.subtotalTouched = true; });
  bindText('people', 'count');
  bindText('tax', 'tax');
  bindText('receipt', 'receipt');
  bindText('tip-custom', 'tipCustom', (v) => { state.tipPreset = v.trim() === '' ? 0 : null; });

  $('subtotal').addEventListener('blur', () => { state.subtotalTouched = true; update(); });
  $('round-up').addEventListener('change', (e) => { state.roundUp = e.target.checked; update(); });

  function stepPeople(delta) {
    const n = Number(state.count.trim());
    state.count = String(Math.min(MAX_PEOPLE, Math.max(1, (Number.isInteger(n) ? n : 1) + delta)));
    $('people').value = state.count;
    update();
  }
  $('people-down').addEventListener('click', () => stepPeople(-1));
  $('people-up').addEventListener('click', () => stepPeople(1));

  document.querySelectorAll('.tip-preset').forEach((b) => {
    b.addEventListener('click', () => {
      state.tipPreset = Number(b.dataset.tip);
      state.tipCustom = '';
      $('tip-custom').value = '';
      update();
    });
  });

  /* Selecting a comparison row picks that tip (AC 5.4). A custom rate's row is already selected. */
  $('tip-table').addEventListener('click', (e) => {
    const row = e.target.closest('tr[data-rate]');
    const preset = row && document.querySelector('.tip-preset[data-tip="' + row.dataset.rate + '"]');
    if (preset) preset.click();
  });

  $('paid-list').addEventListener('change', (e) => {
    const i = Number(e.target.dataset.i);
    if (e.target.checked) paid.add(i); else paid.delete(i);
    $('paid-cleared').textContent = '';
    paidStatus();
  });

  $('bill').addEventListener('submit', (e) => e.preventDefault());

  /* ---------- Events: people and items ---------- */

  $('add-person').addEventListener('click', () => {
    const id = state.nextId++;
    state.diners.push({ id, name: 'Person ' + (state.diners.length + 1) });
    renderDiners();
    renderItems();
    update();
    $('name-' + id).focus();
    $('name-' + id).select();
  });

  $('add-item').addEventListener('click', () => {
    const id = state.nextId++;
    state.items.push({ id, name: '', price: '', who: [] });
    renderItems();
    update();
    $('item-name-' + id).focus();
  });

  $('diners').addEventListener('input', (e) => {
    findById(state.diners, e.target).name = e.target.value;
    refreshNames();
    update();
  });

  $('diners').addEventListener('click', (e) => {
    if (!e.target.closest('.remove-person')) return;
    const gone = findById(state.diners, e.target);
    state.diners = state.diners.filter((p) => p !== gone);
    state.items.forEach((item) => { item.who = item.who.filter((id) => id !== gone.id); });
    renderDiners();
    renderItems();
    update();
    $('add-person').focus();
  });

  $('items').addEventListener('input', (e) => {
    const item = findById(state.items, e.target);
    if (e.target.matches('.item-name')) item.name = e.target.value;
    else if (e.target.matches('.item-price')) item.price = e.target.value;
    else return;
    update();
  });

  $('items').addEventListener('change', (e) => {
    if (!e.target.matches('.who-box')) return;
    const item = findById(state.items, e.target);
    const person = Number(e.target.dataset.person);
    item.who = e.target.checked ? [...item.who, person] : item.who.filter((id) => id !== person);
    update();
  });

  $('items').addEventListener('click', (e) => {
    if (e.target.closest('.everyone')) {
      findById(state.items, e.target).who = state.diners.map((p) => p.id);
      e.target.closest('.who').querySelectorAll('.who-box').forEach((box) => { box.checked = true; });
      return update();
    }
    if (!e.target.closest('.remove-item')) return;
    const gone = findById(state.items, e.target);
    state.items = state.items.filter((item) => item !== gone);
    renderItems();
    update();
    $('add-item').focus();
  });

  /* ---------- Events: copy breakdown (S-9) ---------- */

  let copiedTimer;
  $('copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(breakdown);
      $('copy').textContent = 'Copied';
      clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => { $('copy').textContent = 'Copy breakdown'; }, COPIED_MS);
    } catch {
      $('copy-error').textContent = "Couldn't copy. Select the breakdown below and copy it yourself.";
      $('copy-text').value = breakdown;
      $('copy-text').hidden = false;
      $('copy-text').focus();
      $('copy-text').select();
    }
  });

  /* ---------- Events: start over and undo (S-10) ---------- */

  let undoState = null;
  let undoTimer;

  function hideUndo() {
    clearTimeout(undoTimer);
    undoState = null;
    $('toast').hidden = true;
  }

  $('start-over').addEventListener('click', () => {
    undoState = state;
    state = initialState();
    resetPaid();
    render();
    $('toast').hidden = false;
    clearTimeout(undoTimer);
    undoTimer = setTimeout(hideUndo, UNDO_MS);
    $('undo').focus();
  });

  $('undo').addEventListener('click', () => {
    state = undoState;
    hideUndo();
    resetPaid();
    render();
    $('start-over').focus();
  });

  render();
})();
