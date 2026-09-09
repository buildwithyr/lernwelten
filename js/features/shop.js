/**
 * features/shop.js
 * "Oskars Laden" — Lernspiel zu Geld innerhalb der Rechenwerkstatt.
 *
 * Ablauf je Runde:
 *   1. Ein oder zwei Artikel liegen im Korb. Was kostet das zusammen?
 *   2. Bezahlen: Münzen und Scheine antippen, bis der Betrag stimmt.
 *   3. Rückgeld ausrechnen, wenn zu viel gegeben wurde.
 *
 * Die Ergebnisse fließen in die Lernziele "Münzen legen", "Euro und Cent"
 * und "Rückgeld" ein — dieselbe Bewertung wie in normalen Runden.
 */

const Shop = (() => {

  const ITEMS = MathGen.SHOP_ITEMS;
  const PIECES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

  let state = null;

  function open() {
    const profile = Storage.getActiveProfile();
    if (!profile) return;
    state = {
      round: 0,
      rounds: 5,
      solo: 0, helped: 0, failed: 0,
      results: [],
    };
    nextRound();
  }

  function exit() {
    Timers.invalidate();
    state = null;
    Workshop.open('math');
  }

  function nextRound() {
    if (!state) return;
    if (state.round >= state.rounds) { finish(); return; }
    state.round++;

    const profile = Storage.getActiveProfile();
    const level = Progress.getLevel(profile, 'm2.geldRueckgeld');
    const count = level === 1 ? 1 : Util.randomInt(1, 2);
    const basket = Util.sample(ITEMS, count);
    const price = Util.sum(basket.map(i => i.price));
    // Bezahlt wird mit einem runden Betrag darüber.
    const payOptions = [500, 1000, 2000].filter(v => v >= price);
    const paid = payOptions.length ? payOptions[0] : Math.ceil(price / 100) * 100;

    state.current = {
      basket, price, paid,
      phase: 'total',
      given: [],
      wrong: 0,
      helpUsed: false,
      recorded: false,
    };
    renderRound();
  }

  function renderRound() {
    const c = state.current;
    const phaseTitle = c.phase === 'total' ? 'Was kostet das zusammen?'
      : c.phase === 'pay' ? 'Lege das Geld hin.'
      : 'Wie viel bekommst du zurück?';

    UI.render(`
      <div class="screen shop-screen" style="--accent:#2E86AB">
        ${UI.header({ title: 'Oskars Laden', icon: '🛒', backLabel: 'Laden verlassen' })}
        <main class="task-main">
          <div class="task-card">
            <div class="task-category">
              <span aria-hidden="true">🛒</span><span>Oskars Laden</span>
              <span class="difficulty-indicator">Runde ${state.round} von ${state.rounds}</span>
            </div>

            <div class="shop-basket">
              ${c.basket.map(i => Widgets.priceTag(i.price, i.emoji, i.name)).join('')}
            </div>

            <p class="q-label">${Util.escapeHtml(phaseTitle)}</p>
            <div id="shop-body">${phaseBody(c)}</div>

            <div class="task-feedback hidden" id="task-feedback" role="status"></div>
            <div class="task-actions">
              <button class="btn btn-ghost" id="hint-btn" type="button">💡 Tipp</button>
              <button class="btn btn-ghost" id="tool-btn" type="button">🧰 Münzen ansehen</button>
            </div>
          </div>
        </main>
      </div>`);

    UI.on('#back-btn', 'click', exit);
    UI.on('#tool-btn', 'click', () => Toolbox.open('muenzen'));
    UI.on('#hint-btn', 'click', showHint);
    bindPhase(c);
  }

  function phaseBody(c) {
    if (c.phase === 'total') {
      return `
        <div class="task-input-row">
          <label class="visually-hidden" for="task-answer">Summe in Euro</label>
          <input type="text" id="task-answer" class="task-input task-input--money"
                 inputmode="decimal" maxlength="7" autocomplete="off" />
          <span class="input-unit" aria-hidden="true">€</span>
          <button class="btn btn-primary" id="check-btn" type="button">Fertig ✓</button>
        </div>
        <p class="q-sub">Schreibe zum Beispiel 2,40</p>`;
    }
    if (c.phase === 'pay') {
      return `
        <p class="shop-target">Zu zahlen: <strong>${Util.escapeHtml(Util.formatEuro(c.paid))}</strong></p>
        <div class="coin-tray" id="coin-tray">
          ${PIECES.map(v => `<button class="coin-btn" data-v="${v}" type="button"
            aria-label="${Util.escapeAttr(Util.formatMoneyShort(v))} dazulegen">${Widgets.moneyPiece(v)}</button>`).join('')}
        </div>
        <div class="coin-given" id="coin-given" aria-live="polite">
          <span class="cg-label">Du hast gelegt:</span>
          <span class="cg-sum" id="cg-sum">0,00 €</span>
        </div>
        <div class="task-input-row">
          <button class="btn btn-ghost" id="coin-undo" type="button">↺ Nochmal</button>
          <button class="btn btn-primary" id="check-btn" type="button">Bezahlen ✓</button>
        </div>`;
    }
    return `
      <p class="shop-target">Du hast ${Util.escapeHtml(Util.formatEuro(c.paid))} bezahlt.
        Der Einkauf kostet ${Util.escapeHtml(Util.formatEuro(c.price))}.</p>
      <div class="task-input-row">
        <label class="visually-hidden" for="task-answer">Rückgeld in Euro</label>
        <input type="text" id="task-answer" class="task-input task-input--money"
               inputmode="decimal" maxlength="7" autocomplete="off" />
        <span class="input-unit" aria-hidden="true">€</span>
        <button class="btn btn-primary" id="check-btn" type="button">Fertig ✓</button>
      </div>`;
  }

  function bindPhase(c) {
    if (c.phase === 'pay') {
      UI.onAll('.coin-btn', 'click', e => {
        c.given.push(Number(e.currentTarget.dataset.v));
        updateGiven();
      });
      UI.on('#coin-undo', 'click', () => { c.given = []; updateGiven(); });
      UI.on('#check-btn', 'click', () => checkPay());
      updateGiven();
      return;
    }
    const input = UI.$('#task-answer');
    if (input) {
      input.focus();
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); UI.$('#check-btn').click(); }
      });
    }
    UI.on('#check-btn', 'click', () => {
      const v = (input.value || '').trim();
      if (!v) { UI.announce('Bitte gib einen Betrag ein.'); return; }
      c.phase === 'total' ? checkTotal(v) : checkChange(v);
    });
  }

  function updateGiven() {
    const c = state.current;
    const sum = Util.sum(c.given);
    const el = UI.$('#cg-sum');
    if (el) el.textContent = Util.formatEuro(sum);
    const tray = UI.$('#coin-given');
    if (tray) {
      const old = tray.querySelector('.cg-pieces');
      if (old) old.remove();
      tray.insertAdjacentHTML('beforeend',
        `<span class="cg-pieces">${c.given.map(v => Widgets.moneyPiece(v)).join('')}</span>`);
    }
  }

  function cents(value) {
    const n = AnswerCheck.parseNumber(value);
    return n === null ? null : Math.round(n * 100);
  }

  function checkTotal(value) {
    const c = state.current;
    const given = cents(value);
    if (given === c.price) {
      c.phase = 'pay';
      c.wrong = 0;
      feedback('Genau! Jetzt bezahle bitte.', 'correct');
      Timers.after(900, renderRound);
      return;
    }
    wrongStep(`Zähle die Preise zusammen: ${c.basket.map(i => Util.formatMoneyShort(i.price)).join(' + ')}`,
      () => { c.phase = 'pay'; renderRound(); }, Util.formatEuro(c.price));
  }

  function checkPay() {
    const c = state.current;
    const sum = Util.sum(c.given);
    if (sum === c.paid) {
      c.phase = 'change';
      c.wrong = 0;
      feedback('Perfekt gelegt!', 'correct');
      Timers.after(900, renderRound);
      return;
    }
    if (sum > c.paid) {
      wrongStep('Das ist zu viel. Nimm ein Geldstück weg.', () => { c.phase = 'change'; renderRound(); },
        Util.formatEuro(c.paid));
      return;
    }
    wrongStep(`Es fehlen noch ${Util.formatEuro(c.paid - sum)}.`,
      () => { c.phase = 'change'; renderRound(); }, Util.formatEuro(c.paid));
  }

  function checkChange(value) {
    const c = state.current;
    const given = cents(value);
    const back = c.paid - c.price;
    if (given === back) {
      score(c.wrong === 0 && !c.helpUsed ? 'solo' : 'helped');
      feedback('Richtig! Bis zum nächsten Einkauf.', 'correct');
      Timers.after(1200, nextRound);
      return;
    }
    wrongStep(`Ergänze von ${Util.formatEuro(c.price)} bis ${Util.formatEuro(c.paid)}.`,
      () => { score('failed'); nextRound(); }, Util.formatEuro(back));
  }

  function wrongStep(hint, onGiveUp, solution) {
    const c = state.current;
    c.wrong++;
    c.helpUsed = true;
    if (c.wrong >= 3) {
      feedback(`Die Lösung ist <strong>${Util.escapeHtml(solution)}</strong>. Weiter geht's!`, 'solution');
      Timers.after(1800, onGiveUp);
      return;
    }
    feedback(hint, 'wrong');
    const input = UI.$('#task-answer');
    if (input) { input.value = ''; input.focus(); }
  }

  function showHint() {
    const c = state.current;
    c.helpUsed = true;
    const msg = c.phase === 'total'
      ? 'Zähle die Preise der Artikel zusammen. Fang mit dem größten an.'
      : c.phase === 'pay'
        ? 'Fang mit dem größten Geldstück an, das noch hineinpasst.'
        : 'Ergänze vom Preis bis zu dem Geld, das du gegeben hast.';
    feedback(msg, 'hint');
  }

  function feedback(html, type) {
    const fb = document.getElementById('task-feedback');
    if (!fb) return;
    fb.innerHTML = html;
    fb.className = `task-feedback feedback-${type}`;
    UI.announce(String(html).replace(/<[^>]+>/g, ''));
  }

  /** Verbucht die Runde genau einmal auf dem Lernziel "Rückgeld". */
  function score(outcome) {
    const c = state.current;
    if (c.recorded) return;
    c.recorded = true;
    if (outcome === 'solo') state.solo++;
    else if (outcome === 'helped') state.helped++;
    else state.failed++;

    const profile = Storage.getActiveProfile();
    if (!profile) return;
    Progress.recordAttempt(profile, {
      topicId: 'm2.geldRueckgeld',
      taskId: `m2.geldRueckgeld#shop-${c.price}-${c.paid}`,
      outcome,
      level: Progress.getLevel(profile, 'm2.geldRueckgeld'),
      mode: 'free',
    });
    Storage.saveProfile(profile);
    state.results.push({ topicId: 'm2.geldRueckgeld', outcome });
  }

  function finish() {
    const counts = { solo: state.solo, helped: state.helped, failed: state.failed, total: state.rounds };
    const profile = Storage.getActiveProfile();
    let stars = { total: 0 };
    let fresh = [];
    if (profile) {
      Progress.saveRound(profile, Object.assign({
        topicId: 'm2.geldRueckgeld', mode: 'free', level: Progress.getLevel(profile, 'm2.geldRueckgeld'),
        at: Date.now(),
      }, counts));
      Progress.reviewLevelAfterRound(profile, 'm2.geldRueckgeld', 'free');
      stars = Rewards.starsForRound(counts);
      profile.stars += stars.total;
      profile.level = Math.floor(profile.stars / 10) + 1;
      fresh = Rewards.syncAlbum(profile);
      Storage.saveProfile(profile);
    }
    UI.confetti(['#2E86AB', '#FFD166', '#6DB68A']);

    UI.render(`
      <div class="screen complete-screen" style="--accent:#2E86AB">
        ${UI.header({ title: 'Oskars Laden', icon: '🛒', backLabel: 'Zurück' })}
        <main class="complete-main">
          <div class="complete-card">
            <div class="complete-trophy" aria-hidden="true">🛍️</div>
            <h2 class="complete-praise">Einkauf erledigt!</h2>
            <div class="result-bars">
              <div class="rb-row"><span class="rb-key rb-key--solo">Allein geschafft</span><span class="rb-val">${counts.solo}</span></div>
              <div class="rb-row"><span class="rb-key rb-key--helped">Mit Hilfe geschafft</span><span class="rb-val">${counts.helped}</span></div>
              <div class="rb-row"><span class="rb-key rb-key--open">Noch üben</span><span class="rb-val">${counts.failed}</span></div>
            </div>
            <p class="complete-score-row"><span class="complete-score-text">+${stars.total}
              ${Util.plural(stars.total, 'Stern', 'Sterne')}</span></p>
            ${fresh.length ? `<p class="bonus-note">Neu im Album: ${fresh.map(s => s.emoji).join(' ')}</p>` : ''}
            <div class="complete-actions">
              <button class="btn btn-primary" id="again-btn" type="button">🔄 Noch einmal einkaufen</button>
              <button class="btn btn-ghost" id="home-btn" type="button">🔨 Zur Rechenwerkstatt</button>
            </div>
          </div>
        </main>
      </div>`);

    UI.on('#again-btn', 'click', open);
    UI.on('#home-btn', 'click', exit);
    UI.on('#back-btn', 'click', exit);
  }

  return { open };
})();
