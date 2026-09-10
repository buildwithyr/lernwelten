/**
 * ui/taskview.js
 * Eingabekomponenten für Aufgaben.
 *
 * Jede Eingabeart liefert:
 *   html(task)              Markup für den Eingabebereich
 *   bind(task, api)         Ereignisse verbinden; api.submit(wert) meldet die Antwort
 *   lock(task)              Eingabe sperren (nach der Auswertung)
 *   reveal(task)            richtige Lösung sichtbar machen
 *
 * api:
 *   submit(value)     Antwort abgeben
 *   markHelpUsed()    Hilfe genutzt (z.B. Wort noch einmal ansehen)
 *   announce(text)
 */

const TaskView = (() => {

  const esc = Util.escapeHtml;

  function submitButton(label) {
    return `<button class="btn btn-primary btn-check" id="check-btn" type="button">${esc(label || 'Fertig')} ✓</button>`;
  }

  // ─── Zahleneingabe ────────────────────────────────────────────────────────

  const numberInput = {
    html(task) {
      const max = task.input.max || 100;
      return `
        <div class="task-input-row">
          <label class="visually-hidden" for="task-answer">Deine Antwort als Zahl</label>
          <input type="text" id="task-answer" class="task-input"
                 inputmode="numeric" pattern="[0-9]*" autocomplete="off"
                 maxlength="${String(max).length + 1}" aria-describedby="task-question" />
          ${submitButton()}
        </div>`;
    },
    bind(task, api) {
      const input = UI.$('#task-answer');
      const btn = UI.$('#check-btn');
      if (input) {
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); btn.click(); }
        });
        input.focus();
      }
      if (btn) {
        btn.addEventListener('click', () => {
          const v = (input.value || '').trim();
          if (!v) { api.announce('Bitte gib eine Zahl ein.'); input.focus(); return; }
          api.submit(v);
        });
      }
    },
    clear() { const i = UI.$('#task-answer'); if (i) { i.value = ''; i.focus(); } },
    lock() {
      const i = UI.$('#task-answer'); if (i) i.disabled = true;
      const b = UI.$('#check-btn'); if (b) b.disabled = true;
    },
    reveal(task) {
      const i = UI.$('#task-answer');
      if (i) { i.value = String(task.answer); i.classList.add('task-input--solution'); }
    },
  };

  // ─── Geldeingabe (Euro mit Komma oder Cent) ───────────────────────────────

  const moneyInput = {
    html(task) {
      const unit = task.input.unit === 'cent' ? 'Cent' : '€';
      return `
        <div class="task-input-row">
          <label class="visually-hidden" for="task-answer">Deine Antwort in ${unit}</label>
          <input type="text" id="task-answer" class="task-input task-input--money"
                 inputmode="decimal" autocomplete="off" maxlength="7" />
          <span class="input-unit" aria-hidden="true">${unit}</span>
          ${submitButton()}
        </div>`;
    },
    bind: (task, api) => numberInput.bind(task, api),
    clear: () => numberInput.clear(),
    lock: () => numberInput.lock(),
    reveal(task) {
      const i = UI.$('#task-answer');
      if (i) {
        i.value = String(task.answer).replace('.', ',');
        i.classList.add('task-input--solution');
      }
    },
  };

  // ─── Texteingabe ──────────────────────────────────────────────────────────

  const textInput = {
    html(task) {
      const cap = task.input.autocap || 'sentences';
      const maxLength = task.input.maxLength || 24;
      const wide = maxLength <= 2 ? ' task-input--single' : '';
      return `
        <div class="task-input-row">
          <label class="visually-hidden" for="task-answer">Deine Antwort</label>
          <input type="text" id="task-answer" class="task-input task-input-text${wide}"
                 maxlength="${maxLength}" autocomplete="off" autocorrect="off"
                 autocapitalize="${cap}" spellcheck="false" />
          ${submitButton()}
        </div>`;
    },
    bind(task, api) {
      const input = UI.$('#task-answer');
      const btn = UI.$('#check-btn');
      if (input) {
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); btn.click(); }
        });
        input.focus();
      }
      if (btn) {
        btn.addEventListener('click', () => {
          const v = (input.value || '').trim();
          if (!v) { api.announce('Bitte schreibe eine Antwort.'); input.focus(); return; }
          api.submit(v);
        });
      }
    },
    clear: () => numberInput.clear(),
    lock: () => numberInput.lock(),
    reveal(task) {
      const i = UI.$('#task-answer');
      if (i) { i.value = String(task.answer); i.classList.add('task-input--solution'); }
    },
  };

  // ─── Auswahl ──────────────────────────────────────────────────────────────

  const choiceInput = {
    html(task) {
      return `<div class="choice-grid" id="choice-grid" role="group" aria-label="Antwortmöglichkeiten">
        ${task.input.choices.map((c, i) =>
          `<button type="button" class="choice-btn" data-idx="${i}">${esc(c)}</button>`).join('')}
      </div>`;
    },
    bind(task, api) {
      UI.onAll('.choice-btn', 'click', e => {
        const idx = Number(e.currentTarget.dataset.idx);
        api.submit(String(task.input.choices[idx]));
      });
    },
    lock() { UI.$$('.choice-btn').forEach(b => { b.disabled = true; }); },
    mark(task, given, wasCorrect) {
      UI.$$('.choice-btn').forEach(b => {
        const value = String(task.input.choices[Number(b.dataset.idx)]);
        if (value === String(task.answer)) b.classList.add('choice-btn--correct');
        else if (value === String(given) && !wasCorrect) b.classList.add('choice-btn--wrong');
      });
    },
    reveal(task) {
      UI.$$('.choice-btn').forEach(b => {
        const value = String(task.input.choices[Number(b.dataset.idx)]);
        if (value === String(task.answer)) b.classList.add('choice-btn--correct');
      });
    },
  };

  // ─── Mehrere Zahlenfelder ─────────────────────────────────────────────────

  const fieldsInput = {
    html(task) {
      const labels = task.input.labels || [];
      return `
        <div class="fields-row">
          ${labels.map((l, i) => `
            <div class="field-cell">
              <label class="field-label" for="field-${i}">${esc(l)}</label>
              <input type="text" id="field-${i}" class="task-input task-input--field"
                     inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="3" />
            </div>`).join('')}
        </div>
        <div class="task-input-row">${submitButton()}</div>`;
    },
    bind(task, api) {
      const labels = task.input.labels || [];
      const inputs = labels.map((_, i) => UI.$(`#field-${i}`));
      inputs.forEach((el, i) => {
        if (!el) return;
        el.addEventListener('keydown', e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (i < inputs.length - 1) inputs[i + 1].focus();
          else UI.$('#check-btn').click();
        });
      });
      if (inputs[0]) inputs[0].focus();
      UI.on('#check-btn', 'click', () => {
        const values = inputs.map(el => (el.value || '').trim());
        if (values.some(v => v === '')) {
          api.announce('Bitte fülle alle Felder aus.');
          const empty = inputs.find(el => !el.value.trim());
          if (empty) empty.focus();
          return;
        }
        api.submit(values);
      });
    },
    clear() { UI.$$('.task-input--field').forEach(el => { el.value = ''; }); const f = UI.$('#field-0'); if (f) f.focus(); },
    lock() {
      UI.$$('.task-input--field').forEach(el => { el.disabled = true; });
      const b = UI.$('#check-btn'); if (b) b.disabled = true;
    },
    reveal(task) {
      (task.answer || []).forEach((v, i) => {
        const el = UI.$(`#field-${i}`);
        if (el) { el.value = String(v); el.classList.add('task-input--solution'); }
      });
    },
  };

  // ─── Karten in eine Reihenfolge bringen ───────────────────────────────────

  const orderInput = {
    html(task) {
      const items = task.input.items || [];
      return `
        <div class="order-target" id="order-target" aria-live="polite" aria-label="Deine Reihenfolge">
          <span class="order-placeholder">Tippe die Karten der Reihe nach an.</span>
        </div>
        ${Widgets.wordCards(items, { label: 'Karten' })}
        <div class="task-input-row order-actions">
          <button class="btn btn-ghost" id="order-reset" type="button">↺ Nochmal</button>
          <button class="btn btn-primary btn-check" id="check-btn" type="button" disabled>Fertig ✓</button>
        </div>`;
    },
    bind(task, api) {
      const items = task.input.items || [];
      const chosen = [];
      const target = UI.$('#order-target');
      const checkBtn = UI.$('#check-btn');

      function refresh() {
        if (!chosen.length) {
          target.innerHTML = '<span class="order-placeholder">Tippe die Karten der Reihe nach an.</span>';
        } else {
          target.innerHTML = chosen.map((c, i) =>
            `<span class="order-chip"><span class="order-num">${i + 1}</span>${esc(c.value)}</span>`).join('')
            + (task.input.suffix ? `<span class="order-suffix">${esc(task.input.suffix)}</span>` : '');
        }
        checkBtn.disabled = chosen.length !== items.length;
      }

      UI.onAll('.word-card', 'click', e => {
        const btn = e.currentTarget;
        if (btn.classList.contains('word-card--used')) return;
        btn.classList.add('word-card--used');
        btn.setAttribute('aria-pressed', 'true');
        chosen.push({ value: btn.dataset.value, btn });
        refresh();
        UI.announce(`${btn.dataset.value} an Stelle ${chosen.length}`);
      });

      UI.on('#order-reset', 'click', () => {
        chosen.splice(0, chosen.length);
        UI.$$('.word-card').forEach(b => {
          b.classList.remove('word-card--used');
          b.setAttribute('aria-pressed', 'false');
        });
        refresh();
      });

      UI.on('#check-btn', 'click', () => {
        if (chosen.length !== items.length) return;
        api.submit(chosen.map(c => c.value));
      });

      refresh();
    },
    lock() {
      UI.$$('.word-card').forEach(b => { b.disabled = true; });
      const b = UI.$('#check-btn'); if (b) b.disabled = true;
      const r = UI.$('#order-reset'); if (r) r.disabled = true;
    },
    reveal(task) {
      const target = UI.$('#order-target');
      if (target) {
        target.innerHTML = (task.answer || []).map((c, i) =>
          `<span class="order-chip order-chip--solution"><span class="order-num">${i + 1}</span>${esc(c)}</span>`).join('')
          + (task.input.suffix ? `<span class="order-suffix">${esc(task.input.suffix)}</span>` : '');
      }
    },
  };

  // ─── Mehrere Elemente auswählen ───────────────────────────────────────────

  const setInput = {
    html(task) {
      const items = task.input.items || [];
      const count = task.input.count || items.length;
      return `
        <p class="set-counter" id="set-counter">0 von ${count} gewählt</p>
        <div class="set-grid" role="group" aria-label="Auswahl">
          ${items.map((w, i) =>
            `<button type="button" class="set-item" data-value="${Util.escapeAttr(w)}" aria-pressed="false">${esc(w)}</button>`).join('')}
        </div>
        <div class="task-input-row">
          <button class="btn btn-primary btn-check" id="check-btn" type="button" disabled>Fertig ✓</button>
        </div>`;
    },
    bind(task, api) {
      const count = task.input.count || (task.input.items || []).length;
      const chosen = new Set();
      const counter = UI.$('#set-counter');
      const checkBtn = UI.$('#check-btn');

      function refresh() {
        counter.textContent = `${chosen.size} von ${count} gewählt`;
        checkBtn.disabled = chosen.size !== count;
      }

      UI.onAll('.set-item', 'click', e => {
        const btn = e.currentTarget;
        const value = btn.dataset.value;
        if (chosen.has(value)) {
          chosen.delete(value);
          btn.classList.remove('set-item--on');
          btn.setAttribute('aria-pressed', 'false');
        } else {
          if (chosen.size >= count) {
            api.announce(`Du hast schon ${count} gewählt. Tippe eines wieder ab.`);
            return;
          }
          chosen.add(value);
          btn.classList.add('set-item--on');
          btn.setAttribute('aria-pressed', 'true');
        }
        refresh();
      });

      UI.on('#check-btn', 'click', () => {
        if (chosen.size !== count) return;
        api.submit(Array.from(chosen));
      });
      refresh();
    },
    lock() {
      UI.$$('.set-item').forEach(b => { b.disabled = true; });
      const b = UI.$('#check-btn'); if (b) b.disabled = true;
    },
    reveal(task) {
      const answers = (task.answer || []).map(String);
      UI.$$('.set-item').forEach(b => {
        if (answers.includes(b.dataset.value)) b.classList.add('set-item--solution');
      });
    },
  };

  // ─── Wort im Satz antippen ────────────────────────────────────────────────

  const tapWordInput = {
    html(task) {
      return Widgets.tappableSentence(task.input.words, { label: 'Satz zum Antippen' });
    },
    bind(task, api) {
      UI.onAll('.tap-word', 'click', e => {
        api.submit(String(e.currentTarget.dataset.index));
      });
    },
    lock() { UI.$$('.tap-word').forEach(b => { b.disabled = true; }); },
    mark(task, given, wasCorrect) {
      UI.$$('.tap-word').forEach(b => {
        if (b.dataset.index === String(task.answer)) b.classList.add('tap-word--correct');
        else if (b.dataset.index === String(given) && !wasCorrect) b.classList.add('tap-word--wrong');
      });
    },
    reveal(task) {
      UI.$$('.tap-word').forEach(b => {
        if (b.dataset.index === String(task.answer)) b.classList.add('tap-word--correct');
      });
    },
  };

  // ─── Silbengrenzen antippen ───────────────────────────────────────────────

  const tapGapInput = {
    html(task) {
      return `
        ${Widgets.syllableWord(task.input.word)}
        <p class="set-counter" id="set-counter">0 von ${task.input.count} Grenzen gesetzt</p>
        <div class="task-input-row">
          <button class="btn btn-ghost" id="order-reset" type="button">↺ Nochmal</button>
          <button class="btn btn-primary btn-check" id="check-btn" type="button" disabled>Fertig ✓</button>
        </div>`;
    },
    bind(task, api) {
      const need = task.input.count;
      const chosen = new Set();
      const counter = UI.$('#set-counter');
      const checkBtn = UI.$('#check-btn');

      function refresh() {
        counter.textContent = `${chosen.size} von ${need} ${Util.plural(need, 'Grenze', 'Grenzen')} gesetzt`;
        checkBtn.disabled = chosen.size !== need;
      }

      UI.onAll('.syl-gap', 'click', e => {
        const btn = e.currentTarget;
        const pos = btn.dataset.pos;
        if (chosen.has(pos)) { chosen.delete(pos); btn.classList.remove('syl-gap--on'); }
        else {
          if (chosen.size >= need) { api.announce(`Es sind nur ${need} Grenzen möglich.`); return; }
          chosen.add(pos); btn.classList.add('syl-gap--on');
        }
        refresh();
      });

      UI.on('#order-reset', 'click', () => {
        chosen.clear();
        UI.$$('.syl-gap').forEach(b => b.classList.remove('syl-gap--on'));
        refresh();
      });

      UI.on('#check-btn', 'click', () => {
        if (chosen.size !== need) return;
        api.submit(Array.from(chosen));
      });
      refresh();
    },
    lock() {
      UI.$$('.syl-gap').forEach(b => { b.disabled = true; });
      const b = UI.$('#check-btn'); if (b) b.disabled = true;
      const r = UI.$('#order-reset'); if (r) r.disabled = true;
    },
    reveal(task) {
      const answers = (task.answer || []).map(String);
      UI.$$('.syl-gap').forEach(b => {
        if (answers.includes(b.dataset.pos)) b.classList.add('syl-gap--solution');
      });
    },
  };

  // ─── Formen in Reihenfolge antippen ───────────────────────────────────────

  const tapShapesInput = {
    html(task) {
      return `
        <div class="shape-tap-row" role="group" aria-label="Formen zum Antippen">
          ${task.input.shapes.map(s =>
            `<button type="button" class="shape-tap" data-id="${Util.escapeAttr(s.id)}"
               aria-label="${Util.escapeAttr(s.label)}"><span aria-hidden="true">${s.emoji}</span></button>`).join('')}
        </div>
        <p class="set-counter" id="set-counter">0 von ${task.input.count} getippt</p>
        <div class="task-input-row">
          <button class="btn btn-ghost" id="order-reset" type="button">↺ Nochmal</button>
        </div>`;
    },
    bind(task, api) {
      const need = task.input.count;
      const chosen = [];
      const counter = UI.$('#set-counter');
      UI.onAll('.shape-tap', 'click', e => {
        if (chosen.length >= need) return;
        const btn = e.currentTarget;
        chosen.push(btn.dataset.id);
        btn.classList.add('shape-tap--on');
        btn.insertAdjacentHTML('beforeend', `<span class="shape-tap-num">${chosen.length}</span>`);
        counter.textContent = `${chosen.length} von ${need} getippt`;
        if (chosen.length === need) api.submit(chosen.slice());
      });
      UI.on('#order-reset', 'click', () => {
        chosen.splice(0, chosen.length);
        UI.$$('.shape-tap').forEach(b => {
          b.classList.remove('shape-tap--on');
          const n = b.querySelector('.shape-tap-num');
          if (n) n.remove();
        });
        counter.textContent = `0 von ${need} getippt`;
      });
    },
    lock() { UI.$$('.shape-tap').forEach(b => { b.disabled = true; }); },
    reveal(task) {
      const order = task.answer || [];
      UI.$$('.shape-tap').forEach(b => {
        const pos = order.indexOf(b.dataset.id);
        if (pos >= 0) {
          b.classList.add('shape-tap--solution');
          if (!b.querySelector('.shape-tap-num')) {
            b.insertAdjacentHTML('beforeend', `<span class="shape-tap-num">${pos + 1}</span>`);
          }
        }
      });
    },
  };

  // ─── Spiegelraster ────────────────────────────────────────────────────────

  const mirrorInput = {
    html(task) {
      return `
        ${Widgets.mirrorGrid(task.input.size, task.input.given, { interactive: true })}
        <p class="set-counter" id="set-counter">0 von ${task.input.expected.length} Feldern</p>
        <div class="task-input-row">
          <button class="btn btn-ghost" id="order-reset" type="button">↺ Nochmal</button>
          <button class="btn btn-primary btn-check" id="check-btn" type="button">Fertig ✓</button>
        </div>`;
    },
    bind(task, api) {
      const chosen = new Set();
      const counter = UI.$('#set-counter');
      const need = task.input.expected.length;
      function refresh() { counter.textContent = `${chosen.size} von ${need} Feldern`; }
      UI.onAll('.mg-cell--clickable', 'click', e => {
        const btn = e.currentTarget;
        const key = `${btn.dataset.r},${btn.dataset.c}`;
        if (chosen.has(key)) { chosen.delete(key); btn.classList.remove('mg-cell--on'); btn.setAttribute('aria-pressed', 'false'); }
        else { chosen.add(key); btn.classList.add('mg-cell--on'); btn.setAttribute('aria-pressed', 'true'); }
        refresh();
      });
      UI.on('#order-reset', 'click', () => {
        chosen.clear();
        UI.$$('.mg-cell--clickable').forEach(b => { b.classList.remove('mg-cell--on'); b.setAttribute('aria-pressed', 'false'); });
        refresh();
      });
      UI.on('#check-btn', 'click', () => api.submit(Array.from(chosen)));
      refresh();
    },
    lock() {
      UI.$$('.mg-cell--clickable').forEach(b => { b.disabled = true; });
      const b = UI.$('#check-btn'); if (b) b.disabled = true;
      const r = UI.$('#order-reset'); if (r) r.disabled = true;
    },
    reveal(task) {
      (task.answer || []).forEach(key => {
        const [r, c] = String(key).split(',');
        const el = UI.$(`.mg-cell--clickable[data-r="${r}"][data-c="${c}"]`);
        if (el) el.classList.add('mg-cell--solution');
      });
    },
  };

  // ─── Gedächtnisaufgabe ────────────────────────────────────────────────────

  const memoryInput = {
    html(task) {
      return `
        <div class="memory-stage" id="memory-stage">
          <p class="q-label">🧠 Merke dir diese Wörter!</p>
          <div class="memory-words">${task.input.words.map(w =>
            `<div class="memory-word">${esc(w)}</div>`).join('')}</div>
          <p class="memory-countdown">Noch <span class="memory-countdown-num" id="mem-count">${task.input.seconds}</span> Sekunden …</p>
        </div>
        <div class="choice-grid hidden" id="choice-grid" role="group" aria-label="Antwortmöglichkeiten">
          ${task.input.choices.map((c, i) =>
            `<button type="button" class="choice-btn" data-idx="${i}">${esc(c)}</button>`).join('')}
        </div>`;
    },
    bind(task, api) {
      let remaining = task.input.seconds;
      UI.onAll('.choice-btn', 'click', e => {
        const idx = Number(e.currentTarget.dataset.idx);
        api.submit(String(task.input.choices[idx]));
      });
      Timers.every(1000, stop => {
        remaining--;
        const el = document.getElementById('mem-count');
        if (el) el.textContent = Math.max(0, remaining);
        if (remaining > 0) return;
        stop();
        const stage = document.getElementById('memory-stage');
        if (stage) {
          stage.innerHTML = `<p class="q-label">${esc(task.input.question)}</p>`;
        }
        const grid = document.getElementById('choice-grid');
        if (grid) grid.classList.remove('hidden');
        api.announce(task.input.question);
      });
    },
    lock() { choiceInput.lock(); },
    mark(task, given, wasCorrect) {
      UI.$$('.choice-btn').forEach(b => {
        const value = String(task.input.choices[Number(b.dataset.idx)]);
        if (value === String(task.answer)) b.classList.add('choice-btn--correct');
        else if (value === String(given) && !wasCorrect) b.classList.add('choice-btn--wrong');
      });
    },
    reveal(task) { choiceInput.reveal(task); },
  };

  // ─── Ansehen – verdecken – schreiben ──────────────────────────────────────

  const lookCoverWriteInput = {
    html(task) {
      return `
        <div class="lcw" id="lcw">
          <div class="lcw-show" id="lcw-show">
            <p class="q-label">Schau dir das Wort genau an.</p>
            <p class="lcw-word">${esc(task.input.word)}</p>
            <p class="memory-countdown">Noch <span class="memory-countdown-num" id="lcw-count">${task.input.seconds}</span> Sekunden …</p>
            <button class="btn btn-ghost" id="lcw-ready" type="button">Ich kann es schon ✓</button>
          </div>
          <div class="lcw-write hidden" id="lcw-write">
            <p class="q-label">Schreibe das Wort auf.</p>
            <div class="task-input-row">
              <label class="visually-hidden" for="task-answer">Das Wort</label>
              <input type="text" id="task-answer" class="task-input task-input-text"
                     maxlength="24" autocomplete="off" autocorrect="off"
                     autocapitalize="words" spellcheck="false" />
              ${submitButton()}
            </div>
            <button class="btn btn-ghost btn-sm" id="lcw-peek" type="button">👀 Noch einmal ansehen</button>
          </div>
        </div>`;
    },
    bind(task, api) {
      let remaining = task.input.seconds;

      function toWrite() {
        const show = document.getElementById('lcw-show');
        const write = document.getElementById('lcw-write');
        if (show) show.classList.add('hidden');
        if (write) write.classList.remove('hidden');
        const input = document.getElementById('task-answer');
        if (input) input.focus();
        api.announce('Schreibe das Wort auf.');
      }

      const stopTimer = Timers.every(1000, stop => {
        remaining--;
        const el = document.getElementById('lcw-count');
        if (el) el.textContent = Math.max(0, remaining);
        if (remaining <= 0) { stop(); toWrite(); }
      });

      UI.on('#lcw-ready', 'click', () => { stopTimer(); toWrite(); });

      UI.on('#lcw-peek', 'click', () => {
        api.markHelpUsed();
        const write = document.getElementById('lcw-write');
        if (write) write.classList.add('hidden');
        const show = document.getElementById('lcw-show');
        if (show) {
          show.classList.remove('hidden');
          const c = document.getElementById('lcw-count');
          if (c) c.textContent = '3';
        }
        let left = 3;
        Timers.every(1000, stop => {
          left--;
          const c = document.getElementById('lcw-count');
          if (c) c.textContent = Math.max(0, left);
          if (left <= 0) { stop(); toWrite(); }
        });
      });

      UI.on('#check-btn', 'click', () => {
        const input = document.getElementById('task-answer');
        const v = (input.value || '').trim();
        if (!v) { api.announce('Bitte schreibe das Wort auf.'); input.focus(); return; }
        api.submit(v);
      });

      const input = document.getElementById('task-answer');
      if (input) {
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); UI.$('#check-btn').click(); }
        });
      }
    },
    clear: () => numberInput.clear(),
    lock() {
      numberInput.lock();
      const p = UI.$('#lcw-peek'); if (p) p.disabled = true;
      const r = UI.$('#lcw-ready'); if (r) r.disabled = true;
    },
    reveal(task) {
      const i = UI.$('#task-answer');
      if (i) { i.value = String(task.answer); i.classList.add('task-input--solution'); }
    },
  };

  // ─── Reiner Hinweis ohne Eingabe ──────────────────────────────────────────

  const infoInput = {
    html() {
      return `<div class="task-input-row">
        <button class="btn btn-primary" id="check-btn" type="button">Weiter →</button>
      </div>`;
    },
    bind(task, api) { UI.on('#check-btn', 'click', () => api.submit('ok')); },
    lock() { const b = UI.$('#check-btn'); if (b) b.disabled = true; },
    reveal() {},
  };

  const KINDS = {
    number: numberInput,
    money: moneyInput,
    text: textInput,
    choice: choiceInput,
    fields: fieldsInput,
    order: orderInput,
    set: setInput,
    tapWord: tapWordInput,
    tapGap: tapGapInput,
    tapShapes: tapShapesInput,
    mirror: mirrorInput,
    memory: memoryInput,
    lookCoverWrite: lookCoverWriteInput,
    info: infoInput,
  };

  function forTask(task) {
    return KINDS[task.input.kind] || textInput;
  }

  return { KINDS, forTask };
})();
