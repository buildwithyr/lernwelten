/**
 * tests/browser.test.js
 * Durchläufe in einem echten Browser (Chromium über Playwright).
 *
 * Geprüft werden die Abläufe, die sich mit reinen Modultests nicht abbilden
 * lassen: Start, Profilanlage, Runde spielen, Navigation, Elternbereich,
 * Offline-Start und Bildschirmgröße iPhone-Hochformat.
 *
 * Aufruf:  node tests/browser.test.js
 * Wird NICHT von `npm test` mitgeführt, weil ein Browser gebraucht wird.
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8123;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

// Für den Update-Banner-Test überschreibbar: liefert sw.js aus dem Speicher
// statt von der Festplatte, sobald gesetzt — simuliert ein neues Deployment.
let swOverride = null;

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      if (rel === '/sw.js' && swOverride !== null) {
        res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': 'no-store' });
        res.end(swOverride);
        return;
      }
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

/** Beantwortet die gerade angezeigte Aufgabe richtig. */
async function solveCurrentTask(page) {
  const info = await page.evaluate(() => {
    const s = Session._state();
    if (!s || !s.current) return null;
    const t = s.current.task;
    return { kind: t.input.kind, answer: t.answer };
  });
  if (!info) return false;
  if (info.kind === 'fields') {
    for (let f = 0; f < info.answer.length; f++) await page.fill(`#field-${f}`, String(info.answer[f]));
    await page.click('#check-btn');
  } else if (info.kind === 'choice' || info.kind === 'memory') {
    await page.evaluate(want => {
      const s = Session._state();
      const idx = s.current.task.input.choices.map(String).indexOf(String(want));
      const btn = document.querySelector(`.choice-btn[data-idx="${idx}"]`);
      if (btn) btn.click();
    }, info.answer);
  } else if (info.kind === 'order') {
    await page.evaluate(order => {
      order.forEach(value => {
        const btn = Array.from(document.querySelectorAll('.word-card'))
          .find(b => b.dataset.value === String(value) && !b.classList.contains('word-card--used'));
        if (btn) btn.click();
      });
      document.querySelector('#check-btn').click();
    }, info.answer);
  } else if (info.kind === 'set' || info.kind === 'mirror' || info.kind === 'tapGap') {
    await page.evaluate(answer => {
      const sel = { set: '.set-item', mirror: '.mg-cell--clickable', tapGap: '.syl-gap' };
      const s = Session._state();
      const kind = s.current.task.input.kind;
      answer.forEach(value => {
        let btn;
        if (kind === 'set') {
          btn = Array.from(document.querySelectorAll('.set-item')).find(b => b.dataset.value === String(value));
        } else if (kind === 'mirror') {
          const [r, c] = String(value).split(',');
          btn = document.querySelector(`.mg-cell--clickable[data-r="${r}"][data-c="${c}"]`);
        } else {
          btn = document.querySelector(`.syl-gap[data-pos="${value}"]`);
        }
        if (btn) btn.click();
      });
      document.querySelector('#check-btn').click();
    }, info.answer);
  } else if (info.kind === 'tapWord') {
    await page.click(`.tap-word[data-index="${info.answer}"]`);
  } else if (info.kind === 'tapShapes') {
    await page.evaluate(order => {
      order.forEach(id => {
        const btn = document.querySelector(`.shape-tap[data-id="${id}"]`);
        if (btn) btn.click();
      });
    }, info.answer);
  } else if (info.kind === 'lookCoverWrite') {
    await page.click('#lcw-ready');
    await page.fill('#task-answer', String(info.answer));
    await page.click('#check-btn');
  } else if (info.kind === 'info') {
    await page.click('#check-btn');
  } else {
    await page.fill('#task-answer', String(info.answer));
    await page.click('#check-btn');
  }
  return true;
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✔' : '✖'} ${name}${ok || !detail ? '' : ' — ' + detail}`);
}

/**
 * Simuliert ein echtes Deployment: ein zweiter Service Worker mit neuer
 * Cache-Version wird angeboten, während die Seite offen ist. Geprüft wird
 * der volle Ablauf aus sw.js + js/pwa.js — nicht nur, dass der Code
 * irgendwo die richtigen Bausteine enthält.
 */
async function testUpdateBanner(browser, base) {
  const originalSw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const versionMatch = originalSw.match(/CACHE_VERSION\s*=\s*'([^']+)'/);
  if (!versionMatch) {
    check('Update-Banner: CACHE_VERSION in sw.js gefunden', false);
    return;
  }
  const oldVersion = versionMatch[1];
  const newVersion = oldVersion + '-test';

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'de-AT',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  try {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForSelector('.setup-screen', { timeout: 5000 });

    const noBannerAtStart = await page.$('.update-banner');
    check('Erstbesuch zeigt kein Update-Banner', !noBannerAtStart);

    await page.evaluate(() => navigator.serviceWorker.ready);

    // "Deployment": der Server liefert ab jetzt eine neue sw.js aus.
    swOverride = originalSw.replace(`'${oldVersion}'`, `'${newVersion}'`);
    await page.evaluate(() =>
      navigator.serviceWorker.getRegistration().then(r => r && r.update()));

    await page.waitForSelector('.update-banner', { timeout: 15000 });
    const bannerText = await page.textContent('.update-banner');
    check('Update-Banner erscheint, sobald der neue Worker installiert ist',
      /neue Version/i.test(bannerText), bannerText);

    const applyBtn = await page.$('.update-banner .ub-apply');
    check('Update-Banner hat einen Reload-Button', !!applyBtn);

    const navigation = page.waitForNavigation({ waitUntil: 'load', timeout: 10000 });
    await page.click('.update-banner .ub-apply');
    await navigation;
    check('Klick auf „Jetzt laden" lädt die Seite neu', true);

    await page.waitForSelector('.setup-screen, .village-screen', { timeout: 5000 });
    const activeCaches = await page.evaluate(() => caches.keys());
    check('Neue Cache-Version ist nach dem Reload aktiv',
      activeCaches.includes(newVersion), activeCaches.join(', '));
    check('Alte Cache-Version wurde aufgeräumt',
      !activeCaches.includes(oldVersion), activeCaches.join(', '));

    check('Update-Ablauf ohne JavaScript-Fehler', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (err) {
    check('Update-Banner-Ablauf ohne Ausnahme', false, err.message);
  } finally {
    swOverride = null;
    await context.close();
  }
}

async function run() {
  const server = await startServer();

  // Der vorinstallierte Chromium liegt außerhalb der von dieser
  // Playwright-Version erwarteten Revision — deshalb direkt darauf zeigen,
  // wenn er existiert.
  const preinstalled = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
                        '/opt/pw-browsers/chromium/chrome-linux/chrome']
    .find(p => fs.existsSync(p));
  const browser = await chromium.launch(preinstalled ? { executablePath: preinstalled } : {});
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },      // iPhone 14 Hochformat
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: 'de-AT',
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const base = `http://127.0.0.1:${PORT}/`;

  try {
    // ── Start und Profilanlage ────────────────────────────────────────────
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForSelector('.setup-screen', { timeout: 5000 });
    check('Startbildschirm erscheint', true);

    await page.fill('#player-name', 'Luisa');
    await page.click('[data-grade="2"]');
    await page.click('#start-btn');
    await page.waitForSelector('.village-screen', { timeout: 5000 });
    check('Profil wird angelegt, Dorfplatz erscheint', true);

    const greeting = await page.textContent('.village-welcome');
    check('Name erscheint auf dem Dorfplatz', greeting.includes('Luisa'), greeting);

    // ── Kein horizontales Scrollen im Hochformat ──────────────────────────
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check('Kein horizontaler Überlauf am Dorfplatz', overflow <= 1, 'Überlauf: ' + overflow + 'px');

    // ── Touchflächen groß genug ───────────────────────────────────────────
    const tooSmall = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('button').forEach(b => {
        const r = b.getBoundingClientRect();
        if (r.width && r.height && (r.height < 40 || r.width < 40)) {
          bad.push(`${b.className || b.id}: ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      });
      return bad;
    });
    check('Alle Schaltflächen am Dorfplatz mindestens 40px', tooSmall.length === 0, tooSmall.join(', '));

    // ── Rechenwerkstatt: eine Runde spielen ───────────────────────────────
    await page.click('#building-math');
    await page.waitForSelector('.exercise-menu', { timeout: 5000 });
    check('Rechenwerkstatt öffnet sich', true);

    await page.click('[data-len="5"]');
    await page.waitForTimeout(150);
    await page.click('.exercise-card[data-topic="m2.stellenwert"]');
    await page.waitForSelector('.task-card', { timeout: 5000 });
    check('Aufgabe wird angezeigt', true);

    // Fünf Aufgaben lösen — Lösung direkt aus dem App-Zustand holen.
    let solved = 0;
    for (let i = 0; i < 8; i++) {
      const done = await page.$('.complete-card');
      if (done) break;
      const answer = await page.evaluate(() => {
        const s = Session._state();
        if (!s || !s.current) return null;
        const t = s.current.task;
        return { mode: t.answerMode, answer: t.answer, kind: t.input.kind };
      });
      if (!answer) break;

      if (answer.kind === 'fields') {
        const values = answer.answer;
        for (let f = 0; f < values.length; f++) await page.fill(`#field-${f}`, String(values[f]));
        await page.click('#check-btn');
      } else if (answer.kind === 'choice') {
        await page.evaluate((want) => {
          const s = Session._state();
          const idx = s.current.task.input.choices.map(String).indexOf(String(want));
          document.querySelector(`.choice-btn[data-idx="${idx}"]`).click();
        }, answer.answer);
      } else {
        await page.fill('#task-answer', String(answer.answer));
        await page.click('#check-btn');
      }
      solved++;
      await page.waitForTimeout(1700);
    }
    await page.waitForSelector('.complete-card', { timeout: 8000 });
    check('Runde wird abgeschlossen', true, `${solved} Aufgaben`);

    const resultText = await page.textContent('.result-bars');
    check('Ergebnis unterscheidet allein / mit Hilfe / noch üben',
      resultText.includes('Allein geschafft') && resultText.includes('Mit Hilfe geschafft'),
      resultText.replace(/\s+/g, ' ').slice(0, 90));

    // ── Bestwert getrennt nach Rundenlänge ────────────────────────────────
    const best = await page.evaluate(() => {
      const p = Storage.getActiveProfile();
      return p.sessions['m2.stellenwert'];
    });
    check('Bestwert wird unter der Rundenlänge 5 gespeichert',
      !!(best && best.best && best.best['5']), JSON.stringify(best && best.best));

    await page.click('#home-btn');
    await page.waitForSelector('.village-screen', { timeout: 5000 });
    check('Rückkehr zum Dorfplatz', true);

    // ── "Heute üben" ──────────────────────────────────────────────────────
    await page.click('#daily-btn');
    await page.waitForSelector('.task-card', { timeout: 5000 });
    const dailyTitle = await page.textContent('.workshop-title-block h1');
    check('„Heute üben" startet eine Runde', dailyTitle.includes('Heute'), dailyTitle);

    // Erst eine Aufgabe lösen, damit die Runde wirklich begonnen hat.
    await solveCurrentTask(page);
    await page.waitForTimeout(1700);

    // Verlassen mitten in der Runde: Rückfrage und sauberer Abbruch
    await page.click('#back-btn');
    await page.waitForSelector('.overlay', { timeout: 3000 });
    check('Verlassen einer begonnenen Runde fragt nach', true);
    await page.click('[data-act="yes"]');
    await page.waitForSelector('.village-screen', { timeout: 5000 });
    check('Verlassen einer Runde führt zum Dorfplatz', true);

    // Nach dem Verlassen darf kein alter Timer mehr einen Aufgabenscreen öffnen.
    await page.waitForTimeout(2500);
    const stillVillage = await page.$('.village-screen');
    check('Kein Aufgabenscreen nach dem Verlassen (Timer aufgeräumt)', !!stillVillage);

    // ── Elternbereich ─────────────────────────────────────────────────────
    await page.click('#parents-btn');
    await page.waitForSelector('#gate-answer', { timeout: 3000 });
    const gate = await page.textContent('.gate-question');
    const [a, b] = gate.match(/(\d+)\s*·\s*(\d+)/).slice(1).map(Number);
    await page.fill('#gate-answer', String(a * b));
    await page.click('[data-act="ok"]');
    await page.waitForSelector('.parents-screen', { timeout: 5000 });
    check('Elternbereich öffnet nach der Rechenfrage', true);

    // Thema freigeben
    await page.evaluate(() => {
      const cb = document.querySelector('.tt-check[data-topic="m2.addMitUebergang"]');
      cb.click();
    });
    const unlocked = await page.evaluate(() =>
      !!Storage.getActiveProfile().unlocked['m2.addMitUebergang']);
    check('Thema lässt sich freigeben', unlocked);

    // Buchseite nachschlagen
    await page.selectOption('#bf-series', 'zahlenreise2');
    await page.selectOption('#bf-volume', '1');
    await page.fill('#bf-page', '33');
    await page.click('#bf-go');
    await page.waitForTimeout(200);
    const bf = await page.textContent('#bf-result');
    check('Buchseite 33 führt zu einem belegten Lernziel', bf.includes('Bündeln'), bf.slice(0, 80));

    await page.fill('#bf-page', '999');
    await page.click('#bf-go');
    await page.waitForTimeout(200);
    const bf2 = await page.textContent('#bf-result');
    check('Unbelegte Seite wird ausdrücklich als solche gemeldet',
      bf2.includes('keine belegte Zuordnung'), bf2.slice(0, 80));

    // Lernwörter
    await page.click('.ptab[data-tab="words"]');
    await page.waitForSelector('#lw-input', { timeout: 3000 });
    await page.fill('#lw-input', 'Fahrrad');
    await page.click('#lw-add');
    await page.waitForTimeout(200);
    const words = await page.evaluate(() => Storage.getActiveProfile().learnWords.map(w => w.word));
    check('Lernwort wird gespeichert', words.includes('Fahrrad'), words.join(','));

    await page.fill('#lw-input', 'A1!');
    await page.click('#lw-add');
    await page.waitForTimeout(200);
    const wordErr = await page.textContent('#lw-error');
    check('Ungeeignetes Lernwort wird abgelehnt', /eignet sich nicht/.test(wordErr), wordErr);

    // Lernstand
    await page.click('.ptab[data-tab="progress"]');
    await page.waitForTimeout(300);
    const progressText = await page.textContent('.parents-panel');
    check('Lernstand zeigt Beobachtungen statt Noten',
      progressText.includes('allein geschafft') && progressText.includes('keine Schulnoten'),
      '');

    // Export
    await page.click('.ptab[data-tab="data"]');
    await page.waitForTimeout(200);
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }),
      page.click('#export-btn'),
    ]);
    const dlPath = await download.path();
    const dumped = JSON.parse(fs.readFileSync(dlPath, 'utf8'));
    check('Sicherung enthält das Profil',
      dumped.app === 'lernwelten' && Object.keys(dumped.profiles).length === 1,
      JSON.stringify(Object.keys(dumped.profiles)));

    // ── XSS: Profilname wird als Text ausgegeben ──────────────────────────
    await page.evaluate(() => {
      const p = Storage.getActiveProfile();
      p.name = '<img src=x onerror="window.__xss=1">';
      Storage.saveProfile(p);
      App.showVillage();
    });
    await page.waitForTimeout(400);
    const xss = await page.evaluate(() => window.__xss === 1);
    const shown = await page.textContent('.village-welcome');
    check('Profilname wird als Text gerendert, nicht als HTML',
      !xss && shown.includes('<img'), shown.slice(0, 60));
    await page.evaluate(() => {
      const p = Storage.getActiveProfile();
      p.name = 'Luisa';
      Storage.saveProfile(p);
      App.showVillage();
    });

    // ── Zoom erlaubt ──────────────────────────────────────────────────────
    const viewportMeta = await page.getAttribute('meta[name="viewport"]', 'content');
    check('Zoom ist nicht gesperrt',
      !/user-scalable\s*=\s*no/.test(viewportMeta) && !/maximum-scale\s*=\s*1/.test(viewportMeta),
      viewportMeta);

    // ── Keine externen Anfragen ───────────────────────────────────────────
    const external = [];
    page.on('request', r => {
      const u = new URL(r.url());
      if (u.origin !== `http://127.0.0.1:${PORT}`) external.push(r.url());
    });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    check('Keine Anfragen an fremde Adressen', external.length === 0, external.join(', '));

    // ── Offline-Start ─────────────────────────────────────────────────────
    await page.waitForTimeout(1200);   // Service Worker Zeit zum Zwischenspeichern geben
    const swReady = await page.evaluate(() =>
      navigator.serviceWorker.ready.then(() => true).catch(() => false));
    check('Service Worker ist bereit', swReady);

    await context.setOffline(true);
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const offlineOk = await page.$('.village-screen, .setup-screen');
    check('App startet offline', !!offlineOk);
    await context.setOffline(false);

    // ── Tastaturbedienung ─────────────────────────────────────────────────
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForSelector('.village-screen', { timeout: 5000 });
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement && document.activeElement.tagName);
    check('Tabulator erreicht ein Bedienelement', focused === 'BUTTON' || focused === 'A', focused);

    check('Keine JavaScript-Fehler im Ablauf', errors.length === 0, errors.slice(0, 3).join(' | '));

    // ── Update-Banner: echter Service-Worker-Lebenszyklus ─────────────────
    await testUpdateBanner(browser, base);

  } catch (err) {
    check('Durchlauf ohne Ausnahme', false, err.message);
    console.error(err);
  } finally {
    await browser.close();
    server.close();
  }

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length} von ${results.length} Prüfungen bestanden.`);
  if (failed.length) {
    console.log('Fehlgeschlagen:');
    failed.forEach(f => console.log(' -', f.name, f.detail ? '→ ' + f.detail : ''));
    process.exitCode = 1;
  }
}

run();
