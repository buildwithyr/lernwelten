/**
 * tests/walkthrough-run.js
 * Vollständiger Durchlauf: Jede Übung wird im echten Browser angezeigt,
 * beantwortet und ausgewertet. Zusätzlich werden alle Nebenbildschirme
 * geöffnet.
 *
 * Damit fällt auf, wenn eine Eingabeart nur in der Theorie funktioniert.
 *
 * Aufruf:  node tests/walkthrough-run.js
 *          node tests/walkthrough-run.js --topic m2.symmetrie
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8124;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
};

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(fs.readFileSync(file));
    });
    server.listen(PORT, () => resolve(server));
  });
}

const problems = [];
function fail(topic, message) {
  problems.push(`${topic}: ${message}`);
  console.log(`  ✖ ${topic} — ${message}`);
}

/**
 * Startet eine Runde für ein Thema und beantwortet alle Aufgaben richtig.
 * Prüft dabei Darstellung, Eingabe, Rückmeldung und Abschluss.
 */
async function runTopic(page, topicId, base) {
  const label = topicId;

  await page.evaluate((id) => {
    // Thema freigeben und eine kurze Runde starten.
    Storage.updateActive(p => { p.unlocked[id] = true; p.settings.roundLength = 5; });
    Session.start({
      mode: 'free', topicId: id, length: 3,
      title: 'Test', icon: '🧪', color: '#2E86AB',
      onExit: () => App.showVillage(),
    });
  }, topicId).catch(e => fail(label, 'Start fehlgeschlagen: ' + e.message));

  for (let step = 0; step < 6; step++) {
    const done = await page.$('.complete-card');
    if (done) break;

    await page.waitForSelector('.task-card', { timeout: 4000 }).catch(() => {});

    const info = await page.evaluate(() => {
      const s = Session._state();
      if (!s || !s.current) return null;
      const t = s.current.task;
      return {
        kind: t.input.kind,
        answer: t.answer,
        prompt: t.prompt,
        questionLength: (t.questionHtml || '').length,
        hints: (t.hints || []).length,
        level: t.level,
      };
    });
    if (!info) { fail(label, 'keine Aufgabe im Zustand'); return; }

    // Darstellung geprüft?
    const visibleText = await page.textContent('.task-card');
    if (!visibleText || visibleText.trim().length < 10) fail(label, 'Aufgabenkarte fast leer');
    if (info.hints === 0) fail(label, 'keine Hilfe hinterlegt');

    // Überlauf auf schmalem Display?
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 1) fail(label, `horizontaler Überlauf ${overflow}px`);

    // Eingabefeld vorhanden?
    const hasInput = await page.evaluate(() => {
      const area = document.getElementById('task-input-area');
      return !!area && area.children.length > 0 && area.textContent !== null;
    });
    if (!hasInput) fail(label, 'kein Eingabebereich gerendert');

    // Gestufte Hilfe: erster Tipp darf angezeigt werden
    if (step === 0) {
      const hintBtn = await page.$('#hint-btn');
      if (hintBtn) {
        await hintBtn.click();
        const fb = await page.textContent('#task-feedback').catch(() => '');
        if (!fb || fb.trim().length < 5) fail(label, 'Tipp erscheint nicht');
      }
    }

    const ok = await answerCorrectly(page, info);
    if (!ok) { fail(label, 'Antwort konnte nicht abgegeben werden (' + info.kind + ')'); return; }

    await page.waitForTimeout(info.kind === 'memory' ? 7500 : 1800);
  }

  await page.waitForSelector('.complete-card', { timeout: 12000 })
    .catch(() => fail(label, 'Runde wurde nicht abgeschlossen'));

  // Auswertung prüfen: Nach dem ersten Tipp muss "mit Hilfe" auftauchen.
  const summary = await page.textContent('.result-bars').catch(() => '');
  if (summary && !/Allein geschafft/.test(summary)) fail(label, 'Auswertung ohne "allein geschafft"');

  const recorded = await page.evaluate((id) => {
    const p = Storage.getActiveProfile();
    const s = p.skills[id];
    return s ? { attempts: s.attempts, solo: s.solo, helped: s.helped } : null;
  }, topicId);
  if (!recorded || recorded.attempts < 3) {
    fail(label, 'Lernstand wurde nicht verbucht: ' + JSON.stringify(recorded));
  } else if (recorded.helped < 1) {
    fail(label, 'der genutzte Tipp wurde nicht als Hilfe verbucht');
  }

  await page.evaluate(() => App.showVillage());
  await page.waitForSelector('.village-screen', { timeout: 4000 })
    .catch(() => fail(label, 'Rückkehr zum Dorfplatz misslungen'));
}

async function answerCorrectly(page, info) {
  try {
    switch (info.kind) {
      case 'fields':
        for (let f = 0; f < info.answer.length; f++) {
          await page.fill(`#field-${f}`, String(info.answer[f]));
        }
        await page.click('#check-btn');
        return true;

      case 'choice':
        return await page.evaluate(want => {
          const s = Session._state();
          const idx = s.current.task.input.choices.map(String).indexOf(String(want));
          const btn = document.querySelector(`.choice-btn[data-idx="${idx}"]`);
          if (!btn) return false;
          btn.click();
          return true;
        }, info.answer);

      case 'memory':
        await page.waitForTimeout((await page.evaluate(() =>
          Session._state().current.task.input.seconds)) * 1000 + 600);
        return await page.evaluate(want => {
          const s = Session._state();
          const idx = s.current.task.input.choices.map(String).indexOf(String(want));
          const btn = document.querySelector(`.choice-btn[data-idx="${idx}"]`);
          if (!btn) return false;
          btn.click();
          return true;
        }, info.answer);

      case 'order':
        return await page.evaluate(order => {
          order.forEach(value => {
            const btn = Array.from(document.querySelectorAll('.word-card'))
              .find(b => b.dataset.value === String(value) && !b.classList.contains('word-card--used'));
            if (btn) btn.click();
          });
          const check = document.querySelector('#check-btn');
          if (!check || check.disabled) return false;
          check.click();
          return true;
        }, info.answer);

      case 'set':
        return await page.evaluate(answer => {
          answer.forEach(value => {
            const btn = Array.from(document.querySelectorAll('.set-item'))
              .find(b => b.dataset.value === String(value));
            if (btn) btn.click();
          });
          const check = document.querySelector('#check-btn');
          if (!check || check.disabled) return false;
          check.click();
          return true;
        }, info.answer);

      case 'mirror':
        return await page.evaluate(answer => {
          answer.forEach(key => {
            const [r, c] = String(key).split(',');
            const btn = document.querySelector(`.mg-cell--clickable[data-r="${r}"][data-c="${c}"]`);
            if (btn) btn.click();
          });
          document.querySelector('#check-btn').click();
          return true;
        }, info.answer);

      case 'tapGap':
        return await page.evaluate(answer => {
          answer.forEach(pos => {
            const btn = document.querySelector(`.syl-gap[data-pos="${pos}"]`);
            if (btn) btn.click();
          });
          const check = document.querySelector('#check-btn');
          if (!check || check.disabled) return false;
          check.click();
          return true;
        }, info.answer);

      case 'tapWord':
        await page.click(`.tap-word[data-index="${info.answer}"]`);
        return true;

      case 'tapShapes':
        return await page.evaluate(order => {
          order.forEach(id => {
            const btn = document.querySelector(`.shape-tap[data-id="${id}"]`);
            if (btn) btn.click();
          });
          return true;
        }, info.answer);

      case 'lookCoverWrite':
        await page.click('#lcw-ready');
        await page.waitForTimeout(120);
        await page.fill('#task-answer', String(info.answer));
        await page.click('#check-btn');
        return true;

      case 'info':
        await page.click('#check-btn');
        return true;

      case 'money':
      case 'number':
      case 'text':
      default:
        await page.fill('#task-answer', String(info.answer).replace('.', ','));
        await page.click('#check-btn');
        return true;
    }
  } catch (e) {
    return false;
  }
}

async function run() {
  const only = process.argv.includes('--topic')
    ? process.argv[process.argv.indexOf('--topic') + 1] : null;

  const server = await startServer();
  const preinstalled = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
                        '/opt/pw-browsers/chromium/chrome-linux/chrome'].find(p => fs.existsSync(p));
  const browser = await chromium.launch(preinstalled ? { executablePath: preinstalled } : {});
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'de-AT',
  });
  const page = await context.newPage();
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') jsErrors.push('console: ' + m.text()); });

  const base = `http://127.0.0.1:${PORT}/`;
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('.setup-screen');
  await page.fill('#player-name', 'Luisa');
  await page.click('[data-grade="2"]');
  await page.click('#start-btn');
  await page.waitForSelector('.village-screen');

  // Lernwörter anlegen, damit auch d2.lernwoerter geprüft werden kann.
  await page.evaluate(() => {
    Storage.updateActive(p => {
      p.learnWords = [{ word: 'Fahrrad', addedAt: Date.now() }, { word: 'Jänner', addedAt: Date.now() }];
    });
  });

  const topics = await page.evaluate(() => Topics.all().map(t => ({ id: t.id, grade: t.grade })));
  const list = (only ? topics.filter(t => t.id === only) : topics).map(t => t.id);

  console.log(`Prüfe ${list.length} Lernziele im Browser …\n`);
  let index = 0;
  for (const topicId of list) {
    index++;
    process.stdout.write(`[${index}/${list.length}] ${topicId} … `);
    const before = problems.length;
    await runTopic(page, topicId, base);
    if (problems.length === before) console.log('ok');
  }

  // ── Nebenbildschirme ─────────────────────────────────────────────────────
  console.log('\nPrüfe Nebenbildschirme …');

  const screens = [
    ['Sammelalbum', () => Album.open(), '.album-main'],
    ['Spiegelatelier', () => Mirror.open(), '.mirror-main'],
    ['Oskars Laden', () => Shop.open(), '.shop-screen'],
    ['Arbeitsblatt', () => Worksheet.open('math'), '.worksheet-main'],
    ['Rechenwerkstatt', () => Workshop.open('math'), '.exercise-menu'],
    ['Wörterhaus', () => Workshop.open('german'), '.exercise-menu'],
    ['Forscherlabor', () => Workshop.open('science'), '.exercise-menu'],
    ['Rätselhöhle', () => Workshop.open('logic'), '.exercise-menu'],
  ];

  for (const [name, fn, selector] of screens) {
    await page.evaluate(`(${fn.toString()})()`);
    const ok = await page.waitForSelector(selector, { timeout: 4000 }).then(() => true).catch(() => false);
    if (!ok) fail(name, 'Bildschirm erscheint nicht');
    else {
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 1) fail(name, `horizontaler Überlauf ${overflow}px`);
      console.log(`  ✔ ${name}`);
    }
    await page.evaluate(() => App.showVillage());
    await page.waitForSelector('.village-screen', { timeout: 4000 }).catch(() => {});
  }

  // Werkzeugkiste: jedes Werkzeug einmal öffnen
  const tools = await page.evaluate(() => Object.keys(Toolbox.TOOLS));
  for (const key of tools) {
    await page.evaluate(k => Toolbox.open(k), key);
    const ok = await page.waitForSelector('.tool-body', { timeout: 3000 }).then(() => true).catch(() => false);
    if (!ok) fail('Werkzeug ' + key, 'öffnet nicht');
    await page.evaluate(() => UI.closeAllOverlays());
    await page.waitForTimeout(60);
  }
  console.log(`  ✔ Werkzeugkiste (${tools.length} Werkzeuge)`);

  // Kurz-Check
  await page.evaluate(() => {
    Storage.updateActive(p => { Topics.all().forEach(t => { p.unlocked[t.id] = true; }); });
    Daily.startCheck(1);
  });
  const checkOk = await page.waitForSelector('.check-badge', { timeout: 4000 })
    .then(() => true).catch(() => false);
  if (!checkOk) fail('Kurz-Check', 'startet nicht');
  else {
    const hasHint = await page.$('#hint-btn');
    if (hasHint) fail('Kurz-Check', 'Tipp-Knopf sollte im Check nicht erscheinen');
    console.log('  ✔ Kurz-Check ohne Tipp-Knopf');
  }
  await page.evaluate(() => { Session.abort(); App.showVillage(); });
  await page.waitForSelector('.village-screen', { timeout: 4000 }).catch(() => {});

  // Arbeitsblatt erzeugen
  await page.evaluate(() => Worksheet.open('math'));
  await page.waitForSelector('#ws-build', { timeout: 4000 }).catch(() => {});
  await page.click('#ws-build').catch(() => {});
  const sheetOk = await page.waitForSelector('.print-sheet', { timeout: 5000 })
    .then(() => true).catch(() => false);
  if (!sheetOk) fail('Arbeitsblatt', 'wird nicht erzeugt');
  else {
    const solutions = await page.$$('.ps-solution-list li');
    const tasks = await page.$$('.ps-task');
    if (solutions.length !== tasks.length) {
      fail('Arbeitsblatt', `${tasks.length} Aufgaben, aber ${solutions.length} Lösungen`);
    } else {
      console.log(`  ✔ Arbeitsblatt mit ${tasks.length} Aufgaben und getrennter Lösung`);
    }
  }

  if (jsErrors.length) {
    jsErrors.slice(0, 8).forEach(e => fail('JavaScript', e.slice(0, 160)));
  }

  await browser.close();
  server.close();

  console.log('');
  if (problems.length) {
    console.log(`${problems.length} Probleme:`);
    problems.forEach(p => console.log(' -', p));
    process.exitCode = 1;
  } else {
    console.log(`Alle ${list.length} Lernziele und alle Nebenbildschirme laufen sauber.`);
  }
}

run();
