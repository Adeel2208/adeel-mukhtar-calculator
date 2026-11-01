/*
 * FairShare calculation rules (docs/user-stories.md, "Shared rules").
 * Pure functions with no DOM access. All money is whole cents.
 */
(function (root) {
  'use strict';

  const MAX_CENTS = 100000000; // $1,000,000.00
  const MAX_PEOPLE = 100;

  const MSG = {
    enterSubtotal: 'Enter the bill subtotal to see the split.',
    fix: 'Fix the highlighted fields to see the split.',
    subtotalEmpty: 'Enter the bill subtotal.',
    subtotalZero: 'Subtotal must be more than 0.',
    negative: "Amount can't be negative.",
    notNumber: 'Enter a number, like 42.50.',
    decimals: 'Use at most 2 decimal places.',
    tooBig: 'Enter an amount up to 1,000,000.00.',
    tipNotNumber: 'Enter a tip percentage, like 15.',
    tipRange: 'Tip must be between 0% and 100%.',
    peopleEmpty: 'Enter the number of people.',
    peopleWhole: 'Number of people must be a whole number.',
    peopleMin: 'Number of people must be at least 1.',
    peopleMax: 'Number of people can be at most 100.',
    addItem: 'Add an item to see the split.',
    priceEmpty: 'Enter a price.',
    priceZero: 'Price must be more than 0.',
    nameEmpty: 'Enter a name.',
    nameDuplicate: 'Each person needs a different name.',
    chooseWho: 'Choose who had this item.',
    maxDiners: 'You can add up to 20 people.',
    maxItems: 'You can add up to 50 items.'
  };

  /* "12.5" -> { whole: '12', frac: '5' }; null when not a plain decimal number. */
  function decimalParts(text) {
    const m = /^(\d*)(?:\.(\d*))?$/.exec(text);
    if (!m || (m[1] === '' && !m[2])) return null;
    return { whole: m[1].replace(/^0+(?=\d)/, ''), frac: m[2] || '' };
  }

  /* Value in hundredths (cents, or hundredths of a percent). Huge values become Infinity. */
  function hundredths({ whole, frac }) {
    if (whole.length > 12) return Infinity;
    return Number(whole || 0) * 100 + Number(frac.padEnd(2, '0'));
  }

  /* Rule V-1 / V-2. Returns { value } in cents or { error }. */
  function parseAmount(text, { emptyMessage, zeroMessage } = {}) {
    const t = String(text).trim();
    if (t === '') return emptyMessage ? { error: emptyMessage, empty: true } : { value: 0 };
    if (t[0] === '-') return { error: MSG.negative };
    const parts = decimalParts(t);
    if (!parts) return { error: MSG.notNumber };
    if (parts.frac.length > 2) return { error: MSG.decimals };
    const cents = hundredths(parts);
    if (cents === 0 && zeroMessage) return { error: zeroMessage };
    if (cents > MAX_CENTS) return { error: MSG.tooBig };
    return { value: cents };
  }

  const parseSubtotal = (t) => parseAmount(t, { emptyMessage: MSG.subtotalEmpty, zeroMessage: MSG.subtotalZero });
  const parseTax = (t) => parseAmount(t);
  const parsePrice = (t) => parseAmount(t, { emptyMessage: MSG.priceEmpty, zeroMessage: MSG.priceZero });

  /* Rule V-5: one message per name ('' when fine). Later duplicates are flagged. */
  function checkNames(names) {
    const seen = new Set();
    return names.map((name) => {
      const key = name.trim().toLowerCase();
      if (!key) return MSG.nameEmpty;
      if (seen.has(key)) return MSG.nameDuplicate;
      seen.add(key);
      return '';
    });
  }

  /* Rule V-3. Returns { value } in hundredths of a percent ({ value: null } when empty) or { error }. */
  function parseTip(text) {
    const t = String(text).trim();
    if (t === '') return { value: null };
    if (t[0] === '-') return { error: MSG.tipRange };
    const parts = decimalParts(t);
    if (!parts) return { error: MSG.tipNotNumber };
    if (parts.frac.length > 2) return { error: MSG.decimals };
    const value = hundredths(parts);
    if (value > 10000) return { error: MSG.tipRange };
    return { value };
  }

  /* Rule V-4. */
  function parsePeople(text) {
    const t = String(text).trim();
    if (t === '') return { error: MSG.peopleEmpty };
    if (!/^-?\d+$/.test(t)) return { error: MSG.peopleWhole };
    const n = Number(t);
    if (n < 1) return { error: MSG.peopleMin };
    if (n > MAX_PEOPLE) return { error: MSG.peopleMax };
    return { value: n };
  }

  /* Rule C-2: tip on the pre-tax subtotal, rounded half up, in integers only. */
  function tipCents(subtotal, tipHundredths) {
    return Math.floor((subtotal * tipHundredths + 5000) / 10000);
  }

  /* Rule C-3: n shares of whole cents, larger shares first, summing exactly to total. */
  function splitEven(total, n) {
    const base = Math.floor(total / n);
    const extra = total - base * n;
    return Array.from({ length: n }, (_, i) => (i < extra ? base + 1 : base));
  }

  /* With roundUp (S-12) every share goes up to a whole dollar and the extra is added to the tip. */
  function calculateEven({ subtotal, tax, tip: tipRate, people, roundUp }) {
    const tip = tipCents(subtotal, tipRate);
    const total = subtotal + tax + tip;
    const shares = splitEven(total, people);
    if (!roundUp) return { subtotal, tax, tip, total, shares, extra: 0 };
    const share = Math.ceil(shares[0] / 100) * 100;
    const extra = share * people - total;
    return { subtotal, tax, tip: tip + extra, total: total + extra, shares: shares.map(() => share), extra };
  }

  /*
   * Rule C-5: splits amount in proportion to weights by the largest-remainder
   * method. BigInt keeps amount × weight exact for the biggest allowed bills.
   */
  function allocate(amount, weights) {
    const sum = BigInt(weights.reduce((a, w) => a + w, 0));
    if (sum === 0n) return weights.map(() => 0);
    const parts = weights.map((w, i) => {
      const exact = BigInt(amount) * BigInt(w);
      return { i, share: Number(exact / sum), rest: exact % sum };
    });
    const left = amount - parts.reduce((a, p) => a + p.share, 0);
    [...parts]
      .sort((a, b) => (a.rest === b.rest ? a.i - b.i : a.rest > b.rest ? -1 : 1))
      .slice(0, left)
      .forEach((p) => { p.share += 1; });
    return parts.map((p) => p.share);
  }

  /*
   * Split by item. items: [{ price, who: [person indexes] }].
   * Rule C-4 for shared items, then Rule C-5 for tax and tip.
   */
  function calculateItems({ people, items, tax, tip: tipRate }) {
    const own = new Array(people).fill(0);
    for (const item of items) {
      const who = [...item.who].sort((a, b) => a - b);
      splitEven(item.price, who.length).forEach((cents, k) => { own[who[k]] += cents; });
    }
    const subtotal = own.reduce((a, c) => a + c, 0);
    const tip = tipCents(subtotal, tipRate);
    const taxes = allocate(tax, own);
    const tips = allocate(tip, own);
    const rows = own.map((cents, i) => ({ items: cents, tax: taxes[i], tip: tips[i], total: cents + taxes[i] + tips[i] }));
    return { subtotal, tax, tip, total: subtotal + tax + tip, rows };
  }

  function formatMoney(cents) {
    const whole = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return '$' + whole + '.' + String(cents % 100).padStart(2, '0');
  }

  function formatPercent(h) {
    const frac = h % 100;
    return Math.floor(h / 100) + (frac ? '.' + String(frac).padStart(2, '0').replace(/0$/, '') : '') + '%';
  }

  const countPhrase = (n) => (n === 1 ? '1 person pays' : n + ' people pay');

  /* "Each person pays $41.00" or "1 person pays $33.34 · 2 people pay $33.33". */
  function describeShares(shares) {
    const n = shares.length;
    const high = shares[0];
    const low = shares[n - 1];
    if (high === low) return n === 1 ? countPhrase(1) + ' ' + formatMoney(high) : 'Each person pays ' + formatMoney(high);
    const highCount = shares.filter((s) => s === high).length;
    return countPhrase(highCount) + ' ' + formatMoney(high) + ' · ' + countPhrase(n - highCount) + ' ' + formatMoney(low);
  }

  /* S-5: rows for 10/15/18/20% plus the selected tip when it is not one of them. */
  function compareTips({ subtotal, tax, people, selected }) {
    const rates = [1000, 1500, 1800, 2000];
    if (!rates.includes(selected)) rates.push(selected);
    return rates.sort((a, b) => a - b).map((rate) => {
      const r = calculateEven({ subtotal, tax, tip: rate, people });
      return { rate, tip: r.tip, total: r.total, high: r.shares[0], low: r.shares[people - 1] };
    });
  }

  /* AC 4.1: explains why shares differ by a cent; empty when they are all equal. */
  function sharesNote(shares, total) {
    return shares[0] === shares[shares.length - 1] ? ''
      : 'Shares differ by $0.01 so they add up to exactly ' + formatMoney(total) + '.';
  }

  /* S-11: compares the items total with the subtotal printed on the receipt. */
  function receiptCheck(items, receipt) {
    if (items === receipt) return 'Your items match the receipt subtotal.';
    return 'Your items add up to ' + formatMoney(items) + ', which is ' + formatMoney(Math.abs(receipt - items)) +
      (items < receipt ? ' less' : ' more') + ' than the receipt subtotal of ' + formatMoney(receipt) + '.';
  }

  /* S-9: plain-text breakdowns to paste into a group chat. */
  function totalLine(r, rate) {
    return 'Bill total: ' + formatMoney(r.total) + ' (subtotal ' + formatMoney(r.subtotal) +
      ' + tax ' + formatMoney(r.tax) + ' + ' + formatPercent(rate) + ' tip ' +
      (r.extra ? 'rounded up to ' : '') + formatMoney(r.tip) + ')';
  }

  function evenBreakdown(r, rate) {
    const n = r.shares.length;
    const shares = describeShares(r.shares).replace('Each', 'each').replace(' · ', ', ');
    return totalLine(r, rate) + '\nSplit ' + n + (n === 1 ? ' way: ' : ' ways: ') + shares;
  }

  function itemBreakdown(r, rate, names) {
    return [totalLine(r, rate), ...r.rows.map((row, i) => names[i] + ': ' + formatMoney(row.total) +
      ' (items ' + formatMoney(row.items) + ' + tax ' + formatMoney(row.tax) + ' + tip ' + formatMoney(row.tip) + ')')].join('\n');
  }

  root.FairShare = {
    MSG, parseSubtotal, parseTax, parsePrice, parseTip, parsePeople, checkNames,
    tipCents, splitEven, calculateEven, compareTips, allocate, calculateItems,
    formatMoney, formatPercent, describeShares, sharesNote, evenBreakdown, itemBreakdown, receiptCheck
  };
  if (typeof module !== 'undefined') module.exports = root.FairShare;
})(typeof window !== 'undefined' ? window : globalThis);
