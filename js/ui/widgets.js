/**
 * ui/widgets.js
 * Wiederverwendbare Darstellungen für Aufgaben.
 *
 * Alle Funktionen geben reines HTML als String zurück und fassen das DOM
 * nicht an. Dadurch sind sie in Tests ohne Browser prüfbar und können in
 * `questionHtml`, in Oskars Werkzeugkiste und in Arbeitsblättern
 * gleichermaßen verwendet werden.
 */

const Widgets = (() => {

  const esc = (v) => Util.escapeHtml(v);

  // ─── Mengen ───────────────────────────────────────────────────────────────

  /** Punktebild in Fünferreihen ("Kraft der Fünf"). */
  function dotGrid(n, opts) {
    const o = opts || {};
    const dots = [];
    for (let i = 0; i < n; i++) {
      const five = (i % 10) >= 5 ? ' dot--second-five' : '';
      dots.push(`<span class="dot${five}" aria-hidden="true">●</span>`);
    }
    return `<div class="dot-grid" role="img" aria-label="${o.label || n + ' Punkte'}">${dots.join('')}</div>`;
  }

  /** Zehnerstangen und Einerpunkte für Stellenwertaufgaben. */
  function tenBlocks(tens, ones, opts) {
    const o = opts || {};
    const rods = [];
    for (let t = 0; t < tens; t++) {
      const cells = new Array(10).fill('<span class="tb-cell"></span>').join('');
      rods.push(`<span class="tb-rod" aria-hidden="true">${cells}</span>`);
    }
    const units = [];
    for (let u = 0; u < ones; u++) units.push('<span class="tb-unit" aria-hidden="true"></span>');
    const label = o.label || `${tens} Zehner und ${ones} Einer`;
    return `
      <div class="ten-blocks" role="img" aria-label="${esc(label)}">
        <div class="tb-rods">${rods.join('')}</div>
        <div class="tb-units">${units.join('')}</div>
      </div>`;
  }

  /** Hunderterfeld 10×10, optional mit hervorgehobenem Feld. */
  function hundredField(highlight, opts) {
    const o = opts || {};
    const cells = [];
    for (let n = 1; n <= 100; n++) {
      const isMark = n === highlight;
      const isTen = n % 10 === 0;
      const cls = ['hf-cell'];
      if (isTen) cls.push('hf-cell--ten');
      if (isMark) cls.push('hf-cell--mark');
      const text = o.hideNumbers && !isMark ? '' : (isMark && o.hideMarkNumber ? '?' : n);
      cells.push(`<span class="${cls.join(' ')}">${text}</span>`);
    }
    const label = o.label || (highlight ? `Hunderterfeld, ${highlight} ist markiert` : 'Hunderterfeld');
    return `<div class="hundred-field" role="img" aria-label="${esc(label)}">${cells.join('')}</div>`;
  }

  /**
   * Zahlenstrahl von `from` bis `to`.
   * step:  Abstand der kleinen Striche — bestimmt, was ablesbar ist.
   * labelEvery: Abstand der beschrifteten Striche (Vorgabe: wie step).
   * mark: Wert, der mit einem Pfeil markiert wird (null = keiner)
   *
   * Wichtig: Ein Pfeil darf nur auf einen Wert zeigen, der auch einen Strich
   * hat. Sonst ist die Aufgabe nicht ablesbar, sondern nur zu schätzen.
   */
  function numberLine(from, to, opts) {
    const o = opts || {};
    const step = o.step || 10;
    const labelEvery = o.labelEvery || step;
    const span = to - from;
    const ticks = [];
    for (let v = from; v <= to; v += step) {
      const pct = ((v - from) / span) * 100;
      const major = (v - from) % labelEvery === 0;
      const label = major && !o.hideLabels ? `<span class="nl-label">${v}</span>` : '';
      ticks.push(`<span class="nl-tick${major ? ' nl-tick--major' : ''}" style="left:${pct.toFixed(3)}%">${label}</span>`);
    }
    let marker = '';
    if (o.mark !== undefined && o.mark !== null) {
      const pct = ((o.mark - from) / span) * 100;
      marker = `<span class="nl-marker" style="left:${pct.toFixed(3)}%"><span class="nl-marker-dot"></span><span class="nl-marker-text">${esc(o.markLabel === undefined ? '?' : o.markLabel)}</span></span>`;
    }
    const label = o.label || `Zahlenstrahl von ${from} bis ${to}`;
    return `
      <div class="number-line" role="img" aria-label="${esc(label)}">
        <div class="nl-axis"></div>
        ${ticks.join('')}
        ${marker}
      </div>`;
  }

  // ─── Rechnen ──────────────────────────────────────────────────────────────

  /** Rechenausdruck mit Leerstelle, z.B. 34 + 5 = ? */
  function equation(parts) {
    return `<p class="math-eq">${parts.map(p =>
      p === '?' ? '<span class="math-blank">?</span>' : esc(p)).join(' ')}</p>`;
  }

  /**
   * Rechenmauer. rows: Array von Arrays, von unten nach oben.
   * blanks: [[rowIndex, colIndex], ...] werden als ? gezeigt.
   */
  function pyramid(rows, blanks) {
    const isBlank = (r, c) => (blanks || []).some(b => b[0] === r && b[1] === c);
    const html = rows.slice().reverse().map((row, revIdx) => {
      const r = rows.length - 1 - revIdx;
      const cells = row.map((v, c) =>
        `<span class="pyr-stone${isBlank(r, c) ? ' pyr-stone--blank' : ''}">${isBlank(r, c) ? '?' : esc(v)}</span>`
      ).join('');
      return `<div class="pyr-row">${cells}</div>`;
    }).join('');
    return `<div class="pyramid" role="img" aria-label="Rechenmauer">${html}</div>`;
  }

  /** Gleich große Gruppen: n Behälter mit je k Dingen. */
  function groups(count, each, emoji, containerEmoji) {
    const items = new Array(each).fill(`<span class="grp-item">${emoji}</span>`).join('');
    const boxes = new Array(count).fill(
      `<span class="grp-box">${containerEmoji ? `<span class="grp-container">${containerEmoji}</span>` : ''}<span class="grp-items">${items}</span></span>`
    ).join('');
    return `<div class="groups-view" role="img" aria-label="${count} Gruppen mit je ${each}">${boxes}</div>`;
  }

  /** Punktefeld rows × cols. */
  function pointField(rows, cols) {
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) cells.push('<span class="pf-dot"></span>');
    }
    return `<div class="point-field" style="--pf-cols:${cols}" role="img" aria-label="${rows} Reihen mit je ${cols} Punkten">${cells.join('')}</div>`;
  }

  // ─── Geld ─────────────────────────────────────────────────────────────────

  // Werte in Cent. Nur in Österreich gebräuchliche Münzen und kleine Scheine.
  const COINS = [
    { v: 200, label: '2 €',    cls: 'coin coin--2e' },
    { v: 100, label: '1 €',    cls: 'coin coin--1e' },
    { v: 50,  label: '50 c',   cls: 'coin coin--50' },
    { v: 20,  label: '20 c',   cls: 'coin coin--20' },
    { v: 10,  label: '10 c',   cls: 'coin coin--10' },
    { v: 5,   label: '5 c',    cls: 'coin coin--5' },
    { v: 2,   label: '2 c',    cls: 'coin coin--2' },
    { v: 1,   label: '1 c',    cls: 'coin coin--1' },
  ];
  const NOTES = [
    { v: 2000, label: '20 €', cls: 'note note--20' },
    { v: 1000, label: '10 €', cls: 'note note--10' },
    { v: 500,  label: '5 €',  cls: 'note note--5' },
  ];

  function moneyPiece(value) {
    const found = NOTES.concat(COINS).find(p => p.v === value);
    if (!found) return '';
    return `<span class="${found.cls}">${found.label}</span>`;
  }

  /** Reihe von Münzen/Scheinen aus einer Werteliste (Cent). */
  function moneyRow(values, opts) {
    const o = opts || {};
    const total = Util.sum(values);
    const pieces = values.map(moneyPiece).join('');
    const label = o.label || `Geld: ${Util.formatEuro(total)}`;
    return `<div class="money-row" role="img" aria-label="${esc(label)}">${pieces}</div>`;
  }

  /** Zerlegt einen Betrag in möglichst wenige Münzen/Scheine. */
  function greedyMoney(cents) {
    let rest = cents;
    const out = [];
    NOTES.concat(COINS).forEach(p => {
      while (rest >= p.v) { out.push(p.v); rest -= p.v; }
    });
    return out;
  }

  function priceTag(cents, itemEmoji, itemName) {
    return `<div class="price-tag"><span class="price-emoji">${itemEmoji}</span>
      <span class="price-name">${esc(itemName)}</span>
      <span class="price-value">${esc(Util.formatMoneyShort(cents))}</span></div>`;
  }

  // ─── Daten ────────────────────────────────────────────────────────────────

  function table(columns, rows, opts) {
    const o = opts || {};
    const head = columns.map(c => `<th scope="col">${esc(c)}</th>`).join('');
    const body = rows.map(r => `<tr>${r.map((cell, i) =>
      i === 0 ? `<th scope="row">${esc(cell)}</th>` : `<td>${esc(cell)}</td>`).join('')}</tr>`).join('');
    return `<div class="table-wrap"><table class="data-table">
      ${o.caption ? `<caption>${esc(o.caption)}</caption>` : ''}
      <thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  /**
   * Säulendiagramm. data: [{label, value}]
   *
   * Die Säulen bestehen aus einzelnen Kästchen — eines je Einheit. Nur so
   * lässt sich ein Wert wirklich ablesen; ein glatter Balken ohne Achse wäre
   * bloß zu schätzen. Links steht zusätzlich eine bezifferte Skala.
   */
  function barChart(data, opts) {
    const o = opts || {};
    const max = Math.max.apply(null, data.map(d => d.value).concat([1]));
    // Aufsteigend erzeugt, per `column-reverse` steht die 1 unten — genau
    // auf Höhe des untersten Kästchens.
    const scale = [];
    for (let v = 1; v <= max; v++) scale.push(`<span class="bc-scale-step">${v}</span>`);
    const bars = data.map(d => {
      const units = [];
      for (let i = 0; i < d.value; i++) units.push('<span class="bc-unit"></span>');
      return `<div class="bc-col">
        <div class="bc-bar-wrap"><div class="bc-bar">${units.join('')}</div></div>
        <div class="bc-value">${o.hideValues ? '' : d.value}</div>
        <div class="bc-label">${esc(d.label)}</div>
      </div>`;
    }).join('');
    const label = o.label || 'Säulendiagramm';
    return `<div class="bar-chart" role="img" aria-label="${esc(label)}">
      <div class="bc-scale" aria-hidden="true">${scale.join('')}</div>
      <div class="bc-cols">${bars}</div>
    </div>`;
  }

  // ─── Formen und Raster ────────────────────────────────────────────────────

  function shapeSequence(shapes, blankIndex) {
    return `<div class="shape-sequence">${shapes.map((s, i) =>
      i === blankIndex
        ? '<span class="shape-item--blank">?</span>'
        : `<span class="shape-item">${esc(s)}</span>`).join('')}</div>`;
  }

  function numberSequence(nums, blankLabel) {
    const items = nums.map(n => `<div class="seq-num">${esc(n)}</div><div class="seq-sep">,</div>`).join('');
    return `<div class="number-sequence">${items}<div class="seq-num seq-num--blank">${esc(blankLabel || '?')}</div></div>`;
  }

  /**
   * Raster für Spiegelaufgaben.
   * filled: Menge "r,c"; interactive erzeugt Buttons statt Zellen.
   */
  function mirrorGrid(size, filledLeft, opts) {
    const o = opts || {};
    const filled = new Set(filledLeft.map(c => c.join(',')));
    const cells = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isAxis = c === Math.floor(size / 2);
        const isFilled = filled.has(`${r},${c}`);
        const cls = ['mg-cell'];
        if (isAxis) cls.push('mg-cell--axis');
        if (isFilled) cls.push('mg-cell--on');
        if (o.interactive && c > Math.floor(size / 2)) {
          cls.push('mg-cell--clickable');
          cells.push(`<button type="button" class="${cls.join(' ')}" data-r="${r}" data-c="${c}" aria-label="Feld Zeile ${r + 1}, Spalte ${c + 1}" aria-pressed="${isFilled}"></button>`);
        } else {
          cells.push(`<span class="${cls.join(' ')}"></span>`);
        }
      }
    }
    return `<div class="mirror-grid" style="--mg-size:${size}">${cells.join('')}</div>`;
  }

  function sudokuGrid(grid, row, col) {
    let html = '<div class="sudoku-grid">';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        html += (r === row && c === col)
          ? '<div class="sudoku-cell sudoku-cell--empty">?</div>'
          : `<div class="sudoku-cell">${grid[r][c]}</div>`;
      }
    }
    return html + '</div>';
  }

  // ─── Sprache ──────────────────────────────────────────────────────────────

  /** Satz, in dem ein Wort angetippt werden soll. */
  function tappableSentence(words, opts) {
    const o = opts || {};
    return `<div class="tap-sentence" role="group" aria-label="${esc(o.label || 'Satz')}">${
      words.map((w, i) =>
        `<button type="button" class="tap-word" data-index="${i}">${esc(w)}</button>`).join(' ')
    }</div>`;
  }

  /** Wort, bei dem zwischen zwei Buchstaben getippt wird (Silbengrenze). */
  function syllableWord(word) {
    const letters = word.split('');
    const out = [`<span class="syl-letter">${esc(letters[0])}</span>`];
    for (let i = 1; i < letters.length; i++) {
      out.push(`<button type="button" class="syl-gap" data-pos="${i}" aria-label="Grenze nach Buchstabe ${i}"></button>`);
      out.push(`<span class="syl-letter">${esc(letters[i])}</span>`);
    }
    return `<div class="syllable-word">${out.join('')}</div>`;
  }

  /** Wortkarten, die in eine Reihenfolge gebracht werden. */
  function wordCards(items, opts) {
    const o = opts || {};
    return `<div class="word-cards" role="group" aria-label="${esc(o.label || 'Karten')}">${
      items.map((w, i) => `<button type="button" class="word-card" data-value="${esc(w)}" data-index="${i}">${esc(w)}</button>`).join('')
    }</div>`;
  }

  function maskedWord(masked) {
    return `<p class="word-masked">${esc(masked)}</p>`;
  }

  return {
    COINS, NOTES,
    dotGrid, tenBlocks, hundredField, numberLine,
    equation, pyramid, groups, pointField,
    moneyPiece, moneyRow, greedyMoney, priceTag,
    table, barChart,
    shapeSequence, numberSequence, mirrorGrid, sudokuGrid,
    tappableSentence, syllableWord, wordCards, maskedWord,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Widgets;
