/**
 * features/toolbox.js
 * Oskars Werkzeugkiste — Lernhilfen, die während passender Aufgaben
 * erreichbar sind (Bericht, Abschnitt 9).
 *
 * Ein Werkzeug erklärt nie die konkrete Lösung. Es stellt das Material
 * bereit, mit dem Luisa selbst weiterkommt: Zahlenstrahl, Hunderterfeld,
 * Zehnerstangen, Einmaleins-Tafel, Münzen, Uhr, Silbenhilfe, ABC.
 */

const Toolbox = (() => {

  const TOOLS = {
    zahlenstrahl: {
      title: 'Zahlenstrahl',
      icon: '📏',
      note: 'Zeigt, wo eine Zahl liegt. Von einem Zehner zum nächsten sind es immer 10.',
      body: () => `
        ${Widgets.numberLine(0, 100, { step: 10 })}
        <p class="tool-hint">Zwischen zwei Zehnern liegen neun Zahlen.</p>`,
    },
    hunderterfeld: {
      title: 'Hunderterfeld',
      icon: '🔳',
      note: 'Jede Zeile sind 10. Eine Zeile tiefer heißt 10 mehr.',
      body: () => Widgets.hundredField(null),
    },
    zehnerstangen: {
      title: 'Zehner und Einer',
      icon: '🧱',
      note: 'Eine Stange sind 10 Punkte. Einzelne Punkte sind Einer.',
      body: () => `
        ${Widgets.tenBlocks(3, 4, { label: '3 Zehner und 4 Einer' })}
        <p class="tool-hint">Hier siehst du 34: 3 Zehner und 4 Einer.</p>`,
    },
    einmaleins: {
      title: 'Einmaleins-Tafel',
      icon: '✖️',
      note: 'Suche die Reihe links und die Zahl oben.',
      body: () => multiplicationTable(),
    },
    punktefeld: {
      title: 'Punktefeld',
      icon: '⬛',
      note: 'Reihen mal Punkte pro Reihe — so entsteht eine Malaufgabe.',
      body: () => `
        ${Widgets.pointField(4, 6)}
        <p class="tool-hint">4 Reihen mit je 6 Punkten: 4 · 6.</p>`,
    },
    muenzen: {
      title: 'Münzen und Scheine',
      icon: '🪙',
      note: '100 Cent sind 1 Euro.',
      body: () => `
        ${Widgets.moneyRow([200, 100, 50, 20, 10, 5, 2, 1], { label: 'Alle Münzen' })}
        ${Widgets.moneyRow([2000, 1000, 500], { label: 'Kleine Scheine' })}
        <p class="tool-hint">Fang beim Zusammenzählen immer mit dem größten Stück an.</p>`,
    },
    uhr: {
      title: 'Die Uhr',
      icon: '🕐',
      note: 'Der kleine Zeiger zeigt die Stunde, der große die Minuten.',
      body: () => `
        <div class="tool-clocks">
          <div class="tool-clock">${Clock.render(3, 0, { size: 110 })}<span>3 Uhr</span></div>
          <div class="tool-clock">${Clock.render(3, 15, { size: 110 })}<span>Viertel nach 3</span></div>
          <div class="tool-clock">${Clock.render(3, 30, { size: 110 })}<span>halb 4</span></div>
          <div class="tool-clock">${Clock.render(3, 45, { size: 110 })}<span>Viertel vor 4</span></div>
        </div>
        <p class="tool-hint">Am Nachmittag zählt man zur Stunde 12 dazu: 3 Uhr wird 15:00 Uhr.</p>`,
    },
    silben: {
      title: 'Silbenhilfe',
      icon: '🎵',
      note: 'Sprich das Wort langsam und klatsche bei jeder Silbe.',
      body: () => `
        <div class="tool-syllables">
          <p><strong>Na|se</strong> — zwei Silben</p>
          <p><strong>Son|ne</strong> — zwei Silben, doppelter Mitlaut wird getrennt</p>
          <p><strong>Ta|sche</strong> — sch bleibt zusammen</p>
          <p><strong>Ba|na|ne</strong> — drei Silben</p>
        </div>
        <p class="tool-hint">In jeder Silbe hörst du genau einen Selbstlaut: a, e, i, o, u, ä, ö, ü.</p>`,
    },
    abc: {
      title: 'Das ABC',
      icon: '🔡',
      note: 'Zum Ordnen zählt zuerst der erste Buchstabe.',
      body: () => `
        <div class="tool-abc">${GermanData.ALPHABET.map(l =>
          `<span class="abc-letter">${l}</span>`).join('')}</div>
        <p class="tool-hint">Sind zwei Wörter gleich am Anfang, entscheidet der zweite Buchstabe.</p>`,
    },
    laengen: {
      title: 'Längen',
      icon: '📐',
      note: 'cm, dm und m gehören zusammen.',
      body: () => `
        <ul class="tool-list">
          <li>1 dm = 10 cm</li>
          <li>1 m = 10 dm</li>
          <li>1 m = 100 cm</li>
        </ul>
        <p class="tool-hint">Dein Lineal ist meistens 30 cm lang, also 3 dm.</p>`,
    },
    gewichte: {
      title: 'Gewichte',
      icon: '⚖️',
      note: 'dag heißt Dekagramm.',
      body: () => `
        <ul class="tool-list">
          <li>1 kg = 100 dag</li>
          <li>1 dag = 10 g</li>
        </ul>
        <p class="tool-hint">Ein Sackerl Mehl wiegt ungefähr 1 kg.</p>`,
    },
    spiegel: {
      title: 'Spiegeln',
      icon: '🪞',
      note: 'Gleicher Abstand zur Mittellinie — gleiche Zeile.',
      body: () => `
        ${Widgets.mirrorGrid(5, [[1, 1], [2, 0], [2, 1], [3, 1], [1, 3], [2, 4], [2, 3], [3, 3]])}
        <p class="tool-hint">Zähle, wie viele Felder ein Punkt von der Mitte entfernt ist.
          Auf der anderen Seite sind es genauso viele.</p>`,
    },
  };

  function multiplicationTable() {
    let html = '<div class="mult-table" role="table" aria-label="Einmaleins-Tafel">';
    html += '<div class="mt-row mt-head" role="row"><span class="mt-cell mt-corner">·</span>';
    for (let c = 1; c <= 10; c++) html += `<span class="mt-cell mt-head-cell">${c}</span>`;
    html += '</div>';
    for (let r = 1; r <= 10; r++) {
      html += `<div class="mt-row" role="row"><span class="mt-cell mt-head-cell">${r}</span>`;
      for (let c = 1; c <= 10; c++) html += `<span class="mt-cell">${r * c}</span>`;
      html += '</div>';
    }
    return html + '</div>';
  }

  /** Öffnet ein Werkzeug. `key` kommt aus task.tool. */
  function open(key, task) {
    const tool = TOOLS[key];
    if (!tool) { openPicker(); return; }
    UI.overlay(`
      <div class="tool-head">
        <span class="tool-icon" aria-hidden="true">${tool.icon}</span>
        <h2>${Util.escapeHtml(tool.title)}</h2>
      </div>
      <p class="tool-note">${Util.escapeHtml(tool.note)}</p>
      <div class="tool-body">${tool.body()}</div>
      <button class="btn btn-primary" data-act="close">Zurück zur Aufgabe</button>
    `, { label: 'Oskars Werkzeugkiste: ' + tool.title, wide: true }).modal
      .querySelector('[data-act="close"]')
      .addEventListener('click', () => UI.closeAllOverlays());
  }

  /** Alle Werkzeuge zur Auswahl — für den Dorfplatz. */
  function openPicker() {
    const keys = Object.keys(TOOLS);
    const ov = UI.overlay(`
      <div class="tool-head">
        <span class="tool-icon" aria-hidden="true">🧰</span>
        <h2>Oskars Werkzeugkiste</h2>
      </div>
      <p class="tool-note">Such dir eine Hilfe aus.</p>
      <div class="tool-grid">
        ${keys.map(k => `<button class="tool-choice" data-key="${k}" type="button">
          <span class="tc-icon" aria-hidden="true">${TOOLS[k].icon}</span>
          <span class="tc-label">${Util.escapeHtml(TOOLS[k].title)}</span>
        </button>`).join('')}
      </div>
      <button class="btn btn-ghost" data-act="close">Schließen</button>
    `, { label: 'Oskars Werkzeugkiste', wide: true });

    ov.modal.querySelectorAll('.tool-choice').forEach(btn => {
      btn.addEventListener('click', () => { ov.close(); open(btn.dataset.key); });
    });
    ov.modal.querySelector('[data-act="close"]').addEventListener('click', () => ov.close());
  }

  return { TOOLS, open, openPicker };
})();
