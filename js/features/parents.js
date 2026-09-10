/**
 * features/parents.js
 * Elternbereich: Themen freigeben, Lernstand ansehen, Lernwörter pflegen,
 * Daten sichern und wiederherstellen, Profile verwalten.
 *
 * Der Zugang ist bewusst kein Passwort (das vergisst man), sondern eine
 * kleine Rechenfrage — sie hält Zweitklässlerinnen zuverlässig genug ab,
 * ohne dass jemand ausgesperrt werden kann.
 */

const Parents = (() => {

  let unlockedUntil = 0;
  const UNLOCK_MINUTES = 20;

  function isUnlocked() { return Date.now() < unlockedUntil; }

  function open(tab) {
    if (isUnlocked()) { render(tab || 'topics'); return; }
    askGate(() => render(tab || 'topics'));
  }

  function askGate(onOk) {
    const a = Util.randomInt(6, 9);
    const b = Util.randomInt(6, 9);
    const ov = UI.overlay(`
      <div class="modal-icon" aria-hidden="true">🔐</div>
      <h2>Elternbereich</h2>
      <p class="modal-note">Bitte kurz rechnen, damit dieser Bereich nicht
        aus Versehen geöffnet wird.</p>
      <p class="gate-question">${a} · ${b} = ?</p>
      <div class="task-input-row">
        <label class="visually-hidden" for="gate-answer">Ergebnis</label>
        <input type="text" id="gate-answer" class="task-input" inputmode="numeric" maxlength="3" />
        <button class="btn btn-primary" data-act="ok" type="button">Weiter</button>
      </div>
      <p class="gate-error hidden" id="gate-error" role="alert">Das stimmt noch nicht.</p>
      <button class="btn btn-ghost btn-sm" data-act="cancel" type="button">Abbrechen</button>
    `, { label: 'Elternbereich öffnen' });

    const input = ov.modal.querySelector('#gate-answer');
    function submit() {
      if (Number((input.value || '').trim()) === a * b) {
        unlockedUntil = Date.now() + UNLOCK_MINUTES * 60 * 1000;
        ov.close();
        onOk();
      } else {
        ov.modal.querySelector('#gate-error').classList.remove('hidden');
        input.value = '';
        input.focus();
      }
    }
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    ov.modal.querySelector('[data-act="ok"]').addEventListener('click', submit);
    ov.modal.querySelector('[data-act="cancel"]').addEventListener('click', () => ov.close());
    input.focus();
  }

  // ─── Rahmen ───────────────────────────────────────────────────────────────

  const TABS = [
    { id: 'topics',   label: 'Themen',    icon: '🎯' },
    { id: 'progress', label: 'Lernstand', icon: '📈' },
    { id: 'words',    label: 'Lernwörter', icon: '📒' },
    { id: 'data',     label: 'Daten',     icon: '💾' },
    { id: 'profiles', label: 'Profile',   icon: '👤' },
  ];

  function render(tab) {
    const profile = Storage.getActiveProfile();
    if (!profile) { App.init(); return; }

    UI.render(`
      <div class="screen parents-screen">
        ${UI.header({ title: 'Elternbereich', icon: '👋', backLabel: 'Zurück zum Dorfplatz', hideStars: true })}
        <main class="parents-main">
          <p class="parents-intro">Für <strong>${Util.escapeHtml(profile.name)}</strong>,
            ${profile.grade}. Klasse</p>
          <nav class="parents-tabs" role="tablist">
            ${TABS.map(t => `
              <button class="ptab${t.id === tab ? ' ptab--active' : ''}" role="tab"
                      aria-selected="${t.id === tab}" data-tab="${t.id}" type="button">
                <span aria-hidden="true">${t.icon}</span> ${t.label}
              </button>`).join('')}
          </nav>
          <div class="parents-panel" id="parents-panel" role="tabpanel">
            ${panelHtml(tab, profile)}
          </div>
        </main>
      </div>`);

    UI.on('#back-btn', 'click', () => App.showVillage());
    UI.onAll('.ptab', 'click', e => render(e.currentTarget.dataset.tab));
    bindPanel(tab, profile);
  }

  function panelHtml(tab, profile) {
    switch (tab) {
      case 'progress': return progressPanel(profile);
      case 'words':    return wordsPanel(profile);
      case 'data':     return dataPanel(profile);
      case 'profiles': return profilesPanel(profile);
      default:         return topicsPanel(profile);
    }
  }

  function bindPanel(tab, profile) {
    switch (tab) {
      case 'progress': return bindProgress(profile);
      case 'words':    return bindWords(profile);
      case 'data':     return bindData(profile);
      case 'profiles': return bindProfiles(profile);
      default:         return bindTopics(profile);
    }
  }

  // ─── Themen freigeben ─────────────────────────────────────────────────────

  function topicsPanel(profile) {
    const grade = profile.grade;
    const subjects = [
      { key: 'math', label: 'Mathematik', icon: '🔨' },
      { key: 'german', label: 'Deutsch', icon: '📖' },
      { key: 'science', label: 'Sachwissen', icon: '🔬' },
      { key: 'logic', label: 'Logik', icon: '🗝️' },
    ];

    const bookHtml = grade === 2 ? bookFinderHtml(profile) : '';

    return `
      ${bookHtml}

      <section class="p-section">
        <h2>Rundenlänge</h2>
        <p class="p-note">Wie viele Aufgaben eine Runde hat.</p>
        <div class="session-mode" role="group" aria-label="Rundenlänge">
          <button class="session-mode-btn${profile.settings.roundLength === 5 ? ' selected' : ''}"
                  data-round="5" type="button">5 Aufgaben</button>
          <button class="session-mode-btn${profile.settings.roundLength === 10 ? ' selected' : ''}"
                  data-round="10" type="button">10 Aufgaben</button>
        </div>
      </section>

      <section class="p-section">
        <h2>Schwerpunkt für „Heute üben"</h2>
        <p class="p-note">Diese Themen kommen in einer Runde besonders oft vor.
          Ohne Auswahl mischt die App gleichmäßig.</p>
        <div class="focus-list" id="focus-list">
          ${focusOptions(profile)}
        </div>
      </section>

      ${subjects.map(s => {
        const list = Topics.forSubject(s.key, grade).filter(t => !Topics.isAlwaysOn(t.id));
        if (!list.length) return '';
        return `
        <section class="p-section">
          <h2><span aria-hidden="true">${s.icon}</span> ${s.label}</h2>
          <p class="p-note">Nur freigegebene Themen erscheinen im Menü und in „Heute üben".</p>
          ${Topics.groupBy(list).map(g => `
            <div class="p-group">
              <h3 class="p-group-title">${Util.escapeHtml(g.group)}</h3>
              ${g.topics.map(t => topicToggle(t, profile)).join('')}
            </div>`).join('')}
        </section>`;
      }).join('')}
    `;
  }

  function topicToggle(topic, profile) {
    const on = !!profile.unlocked[topic.id];
    const refs = (topic.book || []).map(r => Topics.formatRef(r)).join(' · ');
    const skill = profile.skills[topic.id];
    const state = skill && skill.attempts
      ? `${skill.solo} von ${skill.attempts} allein`
      : 'noch nicht geübt';
    return `
      <label class="topic-toggle${topic.advanced ? ' topic-toggle--advanced' : ''}">
        <input type="checkbox" class="tt-check" data-topic="${Util.escapeAttr(topic.id)}" ${on ? 'checked' : ''} />
        <span class="tt-body">
          <span class="tt-title">${Util.escapeHtml(topic.icon)} ${Util.escapeHtml(topic.title)}</span>
          <span class="tt-goal">${Util.escapeHtml(topic.goal)}</span>
          ${refs ? `<span class="tt-ref">${Util.escapeHtml(refs)}</span>` : ''}
          <span class="tt-state">${Util.escapeHtml(state)}</span>
        </span>
      </label>`;
  }

  function focusOptions(profile) {
    const grade = profile.grade;
    const unlocked = Topics.all()
      .filter(t => (t.grade === 0 || t.grade === grade) && profile.unlocked[t.id])
      .filter(t => t.subject === 'math' || t.subject === 'german');
    if (!unlocked.length) return '<p class="p-note">Zuerst Themen freigeben.</p>';
    return unlocked.map(t => `
      <label class="focus-chip">
        <input type="checkbox" class="focus-check" data-topic="${Util.escapeAttr(t.id)}"
               ${profile.focusTopics.includes(t.id) ? 'checked' : ''} />
        <span>${Util.escapeHtml(t.title)}</span>
      </label>`).join('');
  }

  function bookFinderHtml(profile) {
    const book = profile.book || {};
    const series = Topics.SERIES;
    return `
      <section class="p-section">
        <h2>Buchseite nachschlagen</h2>
        <p class="p-note">Gib eine gedruckte Buchseite ein. Die App zeigt die dazu
          <strong>belegten</strong> Lernziele. Gibt es keine gesicherte Zuordnung,
          sagt sie das ausdrücklich — es wird nichts geraten.</p>
        <div class="book-finder">
          <label class="bf-field">
            <span>Buch</span>
            <select id="bf-series">
              ${Object.keys(series).map(k =>
                `<option value="${k}" ${book.series === k ? 'selected' : ''}>${Util.escapeHtml(series[k].title)}</option>`).join('')}
            </select>
          </label>
          <label class="bf-field">
            <span>Band</span>
            <select id="bf-volume"></select>
          </label>
          <label class="bf-field">
            <span>Seite</span>
            <input type="text" id="bf-page" inputmode="numeric" maxlength="3"
                   value="${book.page ? Util.escapeAttr(book.page) : ''}" />
          </label>
          <button class="btn btn-primary" id="bf-go" type="button">Suchen</button>
        </div>
        <div class="bf-result" id="bf-result" role="status"></div>
      </section>`;
  }

  function bindTopics(profile) {
    UI.onAll('.tt-check', 'change', e => {
      const id = e.currentTarget.dataset.topic;
      const on = e.currentTarget.checked;
      Storage.updateActive(p => {
        p.unlocked[id] = on;
        if (!on) p.focusTopics = p.focusTopics.filter(x => x !== id);
      });
      UI.announce(`${Topics.get(id).title} ${on ? 'freigegeben' : 'gesperrt'}`);
    });

    UI.onAll('.focus-check', 'change', e => {
      const id = e.currentTarget.dataset.topic;
      Storage.updateActive(p => {
        if (e.currentTarget.checked) {
          if (!p.focusTopics.includes(id)) p.focusTopics.push(id);
        } else {
          p.focusTopics = p.focusTopics.filter(x => x !== id);
        }
      });
    });

    UI.onAll('[data-round]', 'click', e => {
      const len = Number(e.currentTarget.dataset.round) === 5 ? 5 : 10;
      Storage.updateActive(p => { p.settings.roundLength = len; });
      render('topics');
    });

    const seriesSel = UI.$('#bf-series');
    const volumeSel = UI.$('#bf-volume');
    if (seriesSel && volumeSel) {
      const fillVolumes = () => {
        const series = Topics.SERIES[seriesSel.value];
        volumeSel.innerHTML = Object.keys(series.volumes).map(v =>
          `<option value="${v}" ${String(profile.book.volume) === v ? 'selected' : ''}>${Util.escapeHtml(series.volumes[v])}</option>`).join('');
      };
      fillVolumes();
      seriesSel.addEventListener('change', fillVolumes);

      UI.on('#bf-go', 'click', () => {
        const page = parseInt((UI.$('#bf-page').value || '').trim(), 10);
        const out = UI.$('#bf-result');
        if (!page || page < 1 || page > 999) {
          out.innerHTML = '<p class="bf-empty">Bitte eine gedruckte Seitenzahl eingeben.</p>';
          return;
        }
        Storage.updateActive(p => {
          p.book = { series: seriesSel.value, volume: volumeSel.value, page };
        });
        const found = Topics.findByPage(seriesSel.value, volumeSel.value, page);
        if (!found.length) {
          out.innerHTML = `<p class="bf-empty">Für Seite ${page} gibt es in diesem Band
            <strong>keine belegte Zuordnung</strong>. Bitte ein Thema unten von Hand freigeben.</p>`;
          return;
        }
        out.innerHTML = `
          <p class="bf-found">Belegte Lernziele zu Seite ${page}:</p>
          <ul class="bf-list">
            ${found.map(t => `<li>
              <strong>${Util.escapeHtml(t.title)}</strong> — ${Util.escapeHtml(t.goal)}
              <button class="btn btn-sm btn-primary" data-unlock="${Util.escapeAttr(t.id)}" type="button">
                ${Storage.getActiveProfile().unlocked[t.id] ? 'Als Schwerpunkt setzen' : 'Freigeben und als Schwerpunkt setzen'}
              </button>
            </li>`).join('')}
          </ul>`;
        UI.onAll('[data-unlock]', 'click', ev => {
          const id = ev.currentTarget.dataset.unlock;
          Storage.updateActive(p => {
            p.unlocked[id] = true;
            p.focusTopics = Util.uniq(p.focusTopics.concat([id]));
          });
          render('topics');
        });
      });
    }
  }

  // ─── Lernstand ────────────────────────────────────────────────────────────

  function progressPanel(profile) {
    const ids = Object.keys(profile.unlocked)
      .filter(id => profile.unlocked[id] && Topics.get(id));
    const withData = ids.map(id => Progress.skillSummary(profile, id)).filter(Boolean);
    const practiced = withData.filter(s => s.attempts > 0);
    const suggestions = Progress.suggestions(profile, 3);
    const retries = Progress.dueRetries(profile);

    const totals = practiced.reduce((acc, s) => {
      acc.solo += s.solo; acc.helped += s.helped; acc.failed += s.failed; acc.attempts += s.attempts;
      return acc;
    }, { solo: 0, helped: 0, failed: 0, attempts: 0 });

    return `
      <section class="p-section">
        <h2>Überblick</h2>
        ${totals.attempts === 0
          ? '<p class="p-note">Es wurde noch nicht geübt.</p>'
          : `<div class="p-stats">
              <div class="p-stat"><span class="ps-num">${totals.solo}</span><span class="ps-label">allein geschafft</span></div>
              <div class="p-stat"><span class="ps-num">${totals.helped}</span><span class="ps-label">mit Hilfe geschafft</span></div>
              <div class="p-stat"><span class="ps-num">${totals.failed}</span><span class="ps-label">noch üben</span></div>
              <div class="p-stat"><span class="ps-num">${profile.stars}</span><span class="ps-label">Sterne</span></div>
            </div>
            <p class="p-note">Diese Zahlen sind Beobachtungen aus dem Üben — keine Schulnoten.</p>`}
      </section>

      <section class="p-section">
        <h2>Das würde ich als Nächstes üben</h2>
        ${suggestions.length ? `<ol class="suggest-list">
          ${suggestions.map(s => `<li>
            <strong>${Util.escapeHtml(s.summary.title)}</strong>
            <span class="sg-why">${Util.escapeHtml(s.summary.suggestion)}</span>
            <button class="btn btn-sm btn-primary" data-practice="${Util.escapeAttr(s.topicId)}" type="button">
              Jetzt üben
            </button>
          </li>`).join('')}
        </ol>` : '<p class="p-note">Zuerst Themen freigeben.</p>'}
      </section>

      ${retries.length ? `
      <section class="p-section">
        <h2>Offene Wiederholungen</h2>
        <p class="p-note">Diese Aufgaben sind beim letzten Mal nicht gelungen und
          kommen von selbst wieder.</p>
        <ul class="retry-list">
          ${retries.slice(0, 12).map(r => {
            const t = Topics.get(r.topicId);
            return `<li><strong>${Util.escapeHtml(t ? t.title : r.topicId)}</strong>
              <span class="rl-label">${Util.escapeHtml(String(r.label || '').slice(0, 90))}</span></li>`;
          }).join('')}
        </ul>
      </section>` : ''}

      <section class="p-section">
        <h2>Alle Lernziele</h2>
        ${practiced.length === 0 ? '<p class="p-note">Noch keine Daten.</p>' : `
        <div class="skill-table">
          ${practiced.sort((a, b) => (b.last || 0) - (a.last || 0)).map(s => `
            <div class="skill-row skill-row--${s.status}">
              <div class="sr-head">
                <span class="sr-title">${Util.escapeHtml(s.title)}</span>
                <span class="sr-status">${Util.escapeHtml(s.statusText)}</span>
              </div>
              <div class="sr-bar" aria-hidden="true">
                <span class="sr-seg sr-seg--solo" style="flex:${s.solo}"></span>
                <span class="sr-seg sr-seg--helped" style="flex:${s.helped}"></span>
                <span class="sr-seg sr-seg--failed" style="flex:${s.failed}"></span>
              </div>
              <div class="sr-meta">
                ${s.solo} allein · ${s.helped} mit Hilfe · ${s.failed} noch üben
                · Stufe ${s.level} · zuletzt ${Util.escapeHtml(Util.relativeDay(s.last))}
              </div>
              <div class="sr-suggest">${Util.escapeHtml(s.suggestion)}</div>
            </div>`).join('')}
        </div>`}
      </section>

      ${unpracticedHtml(withData)}
    `;
  }

  function unpracticedHtml(all) {
    const none = all.filter(s => s.attempts === 0);
    if (!none.length) return '';
    return `
      <section class="p-section">
        <h2>Freigegeben, aber noch nicht geübt</h2>
        <ul class="plain-list">
          ${none.map(s => `<li>${Util.escapeHtml(s.title)}</li>`).join('')}
        </ul>
      </section>`;
  }

  function bindProgress() {
    UI.onAll('[data-practice]', 'click', e => {
      const id = e.currentTarget.dataset.practice;
      const topic = Topics.get(id);
      if (!topic) return;
      const b = Workshop.get(Workshop.subjectToBuilding(topic.subject));
      Session.start({
        mode: 'practice',
        topicId: id,
        title: b.label,
        icon: b.icon,
        color: b.color,
        onExit: () => open('progress'),
      });
    });
  }

  // ─── Lernwörter ───────────────────────────────────────────────────────────

  function wordsPanel(profile) {
    const words = profile.learnWords || [];
    return `
      <section class="p-section">
        <h2>Lernwörter der Woche</h2>
        <p class="p-note">Fünf bis zehn Wörter genügen. Die App übt sie mit der
          geprüften Form <em>ansehen – verdecken – schreiben</em>.
          Lückentexte oder Silbenaufgaben werden für eigene Wörter bewusst
          <strong>nicht</strong> automatisch erzeugt: Dafür müsste jedes Wort
          einzeln fachlich geprüft werden.</p>

        <div class="word-add">
          <label class="visually-hidden" for="lw-input">Neues Lernwort</label>
          <input type="text" id="lw-input" maxlength="20" placeholder="z.B. Fahrrad"
                 autocomplete="off" autocapitalize="words" />
          <button class="btn btn-primary" id="lw-add" type="button">Hinzufügen</button>
        </div>
        <p class="word-error hidden" id="lw-error" role="alert"></p>

        ${words.length ? `
          <ul class="word-list">
            ${words.map((w, i) => `<li>
              <span class="wl-word">${Util.escapeHtml(w.word)}</span>
              <span class="wl-date">${Util.escapeHtml(Util.relativeDay(w.addedAt))}</span>
              <button class="btn btn-sm btn-ghost" data-remove="${i}" type="button"
                      aria-label="${Util.escapeAttr(w.word)} entfernen">✕</button>
            </li>`).join('')}
          </ul>
          <button class="btn btn-ghost btn-sm" id="lw-clear" type="button">Alle Wörter entfernen</button>`
        : '<p class="p-note">Noch keine Lernwörter eingetragen.</p>'}
      </section>

      <section class="p-section">
        <h2>Übung freigeben</h2>
        <label class="topic-toggle">
          <input type="checkbox" class="tt-check" data-topic="d2.lernwoerter"
                 ${profile.unlocked['d2.lernwoerter'] ? 'checked' : ''} />
          <span class="tt-body">
            <span class="tt-title">📒 Meine Lernwörter</span>
            <span class="tt-goal">Übt die eingetragenen Wörter im Wörterhaus.</span>
          </span>
        </label>
      </section>`;
  }

  function bindWords(profile) {
    const input = UI.$('#lw-input');
    const error = UI.$('#lw-error');

    function showError(msg) {
      if (!error) return;
      error.textContent = msg;
      error.classList.remove('hidden');
    }

    function add() {
      const raw = (input.value || '').trim();
      if (!raw) return;
      const caps = GermanData.learnWordCapabilities(raw);
      if (!caps.lookCoverWrite) {
        showError(`„${raw}" eignet sich nicht als Lernwort (${caps.reason}).`);
        return;
      }
      const current = Storage.getActiveProfile();
      if ((current.learnWords || []).some(w => w.word.toLowerCase() === raw.toLowerCase())) {
        showError('Dieses Wort steht schon in der Liste.');
        return;
      }
      if ((current.learnWords || []).length >= 20) {
        showError('Mehr als 20 Lernwörter werden unübersichtlich. Bitte zuerst welche entfernen.');
        return;
      }
      Storage.updateActive(p => {
        p.learnWords.push({ word: raw, addedAt: Date.now() });
        p.unlocked['d2.lernwoerter'] = true;
      });
      render('words');
    }

    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    UI.on('#lw-add', 'click', add);

    UI.onAll('[data-remove]', 'click', e => {
      const idx = Number(e.currentTarget.dataset.remove);
      Storage.updateActive(p => { p.learnWords.splice(idx, 1); });
      render('words');
    });

    UI.on('#lw-clear', 'click', () => {
      UI.confirm('Alle Lernwörter entfernen?', { title: 'Liste leeren', yes: 'Ja, entfernen' })
        .then(ok => {
          if (!ok) return;
          Storage.updateActive(p => { p.learnWords = []; });
          render('words');
        });
    });

    UI.onAll('.tt-check', 'change', e => {
      const id = e.currentTarget.dataset.topic;
      const on = e.currentTarget.checked;
      Storage.updateActive(p => { p.unlocked[id] = on; });
    });
  }

  // ─── Daten ────────────────────────────────────────────────────────────────

  function dataPanel(profile) {
    const backup = Storage.getBackupInfo();
    const log = Storage.getMigrationLog();
    return `
      <section class="p-section">
        <h2>Sicherung herunterladen</h2>
        <p class="p-note">Speichert alle Profile und Lernstände als Datei.
          Das ist wichtig vor einem Gerätewechsel: Der Fortschritt liegt nur
          in diesem Browser und ist an die Adresse der Seite gebunden.</p>
        <button class="btn btn-primary" id="export-btn" type="button">💾 Sicherung speichern</button>
        <p class="export-status hidden" id="export-status" role="status"></p>
      </section>

      <section class="p-section">
        <h2>Sicherung einspielen</h2>
        <p class="p-note">Die Datei wird zuerst geprüft. Erst danach fragt die App,
          ob die Daten ergänzt oder ersetzt werden sollen.</p>
        <label class="btn btn-ghost file-btn">
          📂 Datei auswählen
          <input type="file" id="import-file" accept="application/json,.json" class="visually-hidden" />
        </label>
        <div class="import-result" id="import-result" role="status"></div>
      </section>

      <section class="p-section">
        <h2>Anzeige</h2>
        <label class="topic-toggle">
          <input type="checkbox" id="opt-motion" ${profile.settings.reduceMotion ? 'checked' : ''} />
          <span class="tt-body">
            <span class="tt-title">Weniger Bewegung</span>
            <span class="tt-goal">Kein Konfetti, keine Wackel-Animationen.</span>
          </span>
        </label>
        <label class="topic-toggle">
          <input type="checkbox" id="opt-install" ${profile.settings.showInstallHint ? 'checked' : ''} />
          <span class="tt-body">
            <span class="tt-title">Installationshinweis zeigen</span>
            <span class="tt-goal">Erscheint erst nach einer abgeschlossenen Runde.</span>
          </span>
        </label>
      </section>

      <section class="p-section">
        <h2>Technische Angaben</h2>
        <ul class="plain-list">
          <li>Speicherschema: Version ${Storage.SCHEMA_VERSION}</li>
          <li>Speicher verfügbar: ${Storage.isAvailable() ? 'ja' : 'nein'}</li>
          ${backup ? `<li>Sicherung der alten Daten vom ${Util.escapeHtml(Util.formatDate(backup.savedAt))}
            liegt im Browser und wird nicht gelöscht.</li>` : ''}
          ${log && log.failed && log.failed.length
            ? `<li class="warn">Bei der Migration gab es ${log.failed.length} Problem(e).
                Die Originaldaten wurden nicht verändert.</li>` : ''}
        </ul>
      </section>`;
  }

  function bindData() {
    UI.on('#export-btn', 'click', () => {
      try {
        const data = Storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = Storage.exportFilename();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        Timers.after(2000, () => URL.revokeObjectURL(url));
        const status = UI.$('#export-status');
        status.textContent = 'Sicherung wurde erstellt: ' + Storage.exportFilename();
        status.classList.remove('hidden');
      } catch (e) {
        UI.info('Die Sicherung konnte nicht erstellt werden: ' + (e && e.message),
          { title: 'Fehler', icon: '⚠️' });
      }
    });

    UI.on('#import-file', 'change', e => {
      const file = e.currentTarget.files && e.currentTarget.files[0];
      if (!file) return;
      const out = UI.$('#import-result');
      if (file.size > 5 * 1024 * 1024) {
        out.innerHTML = '<p class="import-error">Die Datei ist zu groß für eine Lernwelten-Sicherung.</p>';
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => {
        out.innerHTML = '<p class="import-error">Die Datei konnte nicht gelesen werden.</p>';
      };
      reader.onload = () => {
        let parsed;
        try { parsed = JSON.parse(reader.result); }
        catch (err) {
          out.innerHTML = '<p class="import-error">Die Datei ist keine gültige JSON-Datei.</p>';
          return;
        }
        const check = Storage.validateImport(parsed);
        if (!check.ok) {
          out.innerHTML = `<p class="import-error">Import nicht möglich:</p>
            <ul class="plain-list">${check.errors.map(x => `<li>${Util.escapeHtml(x)}</li>`).join('')}</ul>`;
          return;
        }
        const names = Object.keys(check.profiles).map(id => check.profiles[id].name);
        out.innerHTML = `
          <p class="import-ok">Die Datei ist in Ordnung. Gefunden:
            ${check.count} ${Util.plural(check.count, 'Profil', 'Profile')}
            (${names.map(n => Util.escapeHtml(n)).join(', ')}).</p>
          ${check.warnings.length ? `<ul class="plain-list warn">${check.warnings.map(w =>
            `<li>${Util.escapeHtml(w)}</li>`).join('')}</ul>` : ''}
          <div class="import-actions">
            <button class="btn btn-primary" data-import="merge" type="button">Ergänzen</button>
            <button class="btn btn-ghost" data-import="replace" type="button">Alles ersetzen</button>
          </div>`;

        UI.onAll('[data-import]', 'click', ev => {
          const mode = ev.currentTarget.dataset.import;
          const question = mode === 'replace'
            ? 'Alle bisherigen Profile auf diesem Gerät werden durch die Sicherung ersetzt. Fortfahren?'
            : 'Profile aus der Sicherung werden ergänzt. Gleiche Profile werden überschrieben. Fortfahren?';
          UI.confirm(question, { title: 'Sicherung einspielen', yes: 'Ja, einspielen' }).then(ok => {
            if (!ok) return;
            const result = Storage.applyImport(check, mode);
            if (!result.ok) {
              UI.info(result.error, { title: 'Import fehlgeschlagen', icon: '⚠️' });
              return;
            }
            UI.info(`${result.count} ${Util.plural(result.count, 'Profil wurde', 'Profile wurden')} übernommen.`,
              { title: 'Fertig', icon: '✅' });
            render('data');
          });
        });
      };
      reader.readAsText(file);
    });

    UI.on('#opt-motion', 'change', e => {
      const on = e.currentTarget.checked;
      Storage.updateActive(p => { p.settings.reduceMotion = on; });
    });
    UI.on('#opt-install', 'change', e => {
      const on = e.currentTarget.checked;
      Storage.updateActive(p => { p.settings.showInstallHint = on; });
    });
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  function profilesPanel(active) {
    const list = Storage.listProfiles();
    return `
      <section class="p-section">
        <h2>Profile auf diesem Gerät</h2>
        <div class="profile-list">
          ${list.map(p => `
            <div class="profile-row${p.id === active.id ? ' profile-row--active' : ''}">
              <span class="pr-avatar" aria-hidden="true">${ProfileUI.avatarEmoji(p.avatarId)}</span>
              <span class="pr-body">
                <span class="pr-name">${Util.escapeHtml(p.name)}</span>
                <span class="pr-meta">${p.grade}. Klasse · ${p.stars} ⭐ ·
                  angelegt ${Util.escapeHtml(Util.formatDate(p.createdAt))}</span>
              </span>
              <span class="pr-actions">
                ${p.id === active.id ? '<span class="pr-current">aktiv</span>'
                  : `<button class="btn btn-sm btn-primary" data-switch="${Util.escapeAttr(p.id)}" type="button">Wechseln</button>`}
                <button class="btn btn-sm btn-ghost" data-rename="${Util.escapeAttr(p.id)}" type="button">Umbenennen</button>
                ${list.length > 1 ? `<button class="btn btn-sm btn-ghost" data-delete="${Util.escapeAttr(p.id)}" type="button">Löschen</button>` : ''}
              </span>
            </div>`).join('')}
        </div>
        <button class="btn btn-ghost" id="new-profile" type="button">➕ Neues Profil anlegen</button>
      </section>

      <section class="p-section">
        <h2>Klassenstufe</h2>
        <p class="p-note">Bestimmt, welche Themen zur Auswahl stehen.
          Der Lernstand bleibt beim Wechsel erhalten.</p>
        <div class="session-mode" role="group" aria-label="Klassenstufe">
          <button class="session-mode-btn${active.grade === 1 ? ' selected' : ''}" data-grade="1" type="button">1. Klasse</button>
          <button class="session-mode-btn${active.grade === 2 ? ' selected' : ''}" data-grade="2" type="button">2. Klasse</button>
        </div>
      </section>`;
  }

  function bindProfiles() {
    UI.onAll('[data-switch]', 'click', e => {
      Storage.setActiveProfileId(e.currentTarget.dataset.switch);
      render('profiles');
    });

    UI.onAll('[data-rename]', 'click', e => {
      const id = e.currentTarget.dataset.rename;
      const p = Storage.getProfile(id);
      if (!p) return;
      const ov = UI.overlay(`
        <h2>Profil umbenennen</h2>
        <div class="task-input-row">
          <label class="visually-hidden" for="rename-input">Neuer Name</label>
          <input type="text" id="rename-input" class="task-input task-input-text"
                 maxlength="24" value="${Util.escapeAttr(p.name)}" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" data-act="ok" type="button">Speichern</button>
          <button class="btn btn-ghost" data-act="cancel" type="button">Abbrechen</button>
        </div>`, { label: 'Profil umbenennen' });
      const input = ov.modal.querySelector('#rename-input');
      ov.modal.querySelector('[data-act="ok"]').addEventListener('click', () => {
        const name = (input.value || '').trim().slice(0, 24);
        if (name.length < 2) { input.focus(); return; }
        const fresh = Storage.getProfile(id);
        fresh.name = name;
        Storage.saveProfile(fresh);
        ov.close();
        render('profiles');
      });
      ov.modal.querySelector('[data-act="cancel"]').addEventListener('click', () => ov.close());
      input.select();
    });

    UI.onAll('[data-delete]', 'click', e => {
      const id = e.currentTarget.dataset.delete;
      const p = Storage.getProfile(id);
      if (!p) return;
      UI.confirm(`Das Profil „${p.name}" und sein gesamter Lernstand werden gelöscht. `
        + 'Am besten vorher eine Sicherung herunterladen. Wirklich löschen?',
        { title: 'Profil löschen', icon: '🗑️', yes: 'Ja, löschen' }).then(ok => {
        if (!ok) return;
        Storage.deleteProfile(id);
        render('profiles');
      });
    });

    UI.on('#new-profile', 'click', () => ProfileUI.renderSetup({ allowCancel: true, onCancel: () => open('profiles') }));

    UI.onAll('[data-grade]', 'click', e => {
      const g = Number(e.currentTarget.dataset.grade) === 2 ? 2 : 1;
      Storage.setGrade(g);
      render('profiles');
    });
  }

  return { open, isUnlocked, render };
})();
