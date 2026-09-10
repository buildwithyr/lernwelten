/**
 * tests/screenshots-run.js
 * Erzeugt die Bildschirmfotos für die README im iPhone-Hochformat.
 *
 * Aufruf: node tests/screenshots-run.js
 * Ergebnis: docs/screenshots/*.png
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs/screenshots');
const PORT = 8125;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end(); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(fs.readFileSync(file));
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startServer();
  const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
               '/opt/pw-browsers/chromium/chrome-linux/chrome'].find(p => fs.existsSync(p));
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: 'de-AT',
  });
  const page = await context.newPage();
  const base = `http://127.0.0.1:${PORT}/`;

  async function shot(name) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, name + '.png') });
    console.log('  ✔', name + '.png');
  }

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('.setup-screen');
  await page.fill('#player-name', 'Luisa');
  await page.click('[data-grade="2"]');
  await shot('00-start');

  await page.click('#start-btn');
  await page.waitForSelector('.village-screen');

  // Etwas Lernstand erzeugen, damit die Bilder nicht leer wirken.
  await page.evaluate(() => {
    Storage.updateActive(p => {
      p.stars = 46;
      p.level = 5;
      p.focusTopics = ['m2.stellenwert'];
      p.learnWords = [{ word: 'Fahrrad', addedAt: Date.now() }];
      ['m2.stellenwert', 'm2.addOhneUebergang', 'm2.reihe2', 'd2.abc', 'd2.mehrzahl'].forEach((id, i) => {
        p.skills[id] = {
          level: 1 + (i % 2), levelSince: 0, roundsOnLevel: 1, firstTry: [1, 1, 0, 1],
          solo: 9 + i, helped: 3, failed: i % 3, attempts: 12 + i + (i % 3),
          last: Date.now() - i * 86400000, box: 2, dueAt: Date.now(),
        };
        p.sessions[id] = { plays: 3, best: { '10': { solo: 8, done: 9, total: 10, at: Date.now() } }, last: null, history: [] };
      });
      p.totalRounds = 12;
      Rewards.syncAlbum(p);
    });
    App.showVillage();
  });
  await shot('01-dorfplatz');

  await page.evaluate(() => Workshop.open('math'));
  await page.waitForSelector('.exercise-menu');
  await shot('02-rechenwerkstatt');

  await page.evaluate(() => {
    Session.start({
      mode: 'free', topicId: 'm2.stellenwert', length: 5,
      title: 'Rechenwerkstatt', icon: '🔨', color: '#2E86AB',
      onExit: () => App.showVillage(),
    });
  });
  await page.waitForSelector('.task-card');
  await shot('03-aufgabe-stellenwert');

  await page.evaluate(() => {
    Session.abort();
    Session.start({
      mode: 'free', topicId: 'm2.zahlenstrahl', length: 5,
      title: 'Rechenwerkstatt', icon: '🔨', color: '#2E86AB',
      onExit: () => App.showVillage(),
    });
  });
  await page.waitForSelector('.task-card');
  await shot('04-zahlenstrahl');

  await page.evaluate(() => {
    Session.abort();
    Session.start({
      mode: 'free', topicId: 'd2.satzbau', length: 5,
      title: 'Wörterhaus', icon: '📖', color: '#C1447E',
      onExit: () => App.showVillage(),
    });
  });
  await page.waitForSelector('.task-card');
  await shot('05-satzbau');

  await page.evaluate(() => { Session.abort(); Toolbox.open('hunderterfeld'); });
  await page.waitForSelector('.tool-body');
  await shot('06-werkzeugkiste');
  await page.evaluate(() => UI.closeAllOverlays());

  await page.evaluate(() => { App.showVillage(); });
  await page.waitForSelector('.village-screen');
  await page.evaluate(() => Album.open());
  await page.waitForSelector('.album-main');
  await shot('07-sammelalbum');

  await page.evaluate(() => { Parents.open('progress'); });
  await page.waitForTimeout(300);
  const gate = await page.$('#gate-answer');
  if (gate) {
    const q = await page.textContent('.gate-question');
    const [a, b] = q.match(/(\d+)\s*·\s*(\d+)/).slice(1).map(Number);
    await page.fill('#gate-answer', String(a * b));
    await page.click('[data-act="ok"]');
  }
  await page.waitForSelector('.parents-screen');
  await shot('08-elternbereich-lernstand');

  await page.click('.ptab[data-tab="topics"]');
  await page.waitForTimeout(400);
  await shot('09-elternbereich-themen');

  await browser.close();
  server.close();
  console.log('\nBildschirmfotos liegen in docs/screenshots.');
}

run();
