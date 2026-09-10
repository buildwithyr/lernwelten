/**
 * tests/offline.test.js
 * Prüft, dass die Offline-Liste im Service Worker vollständig ist.
 *
 * Hintergrund (Bericht, Abschnitt 3): In Version 1 fehlte js/pwa.js in der
 * Liste der vorab gespeicherten Dateien. Solche Lücken fallen im Betrieb
 * erst offline auf — deshalb prüft dieser Test sie automatisch.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

const indexHtml = read('index.html');
const swJs = read('sw.js');

/** Alle im HTML eingebundenen eigenen Dateien. */
function referencedFromHtml() {
  const out = [];
  const patterns = [
    /<script[^>]+src="([^"]+)"/g,
    /<link[^>]+href="([^"]+)"/g,
  ];
  patterns.forEach(re => {
    let m;
    while ((m = re.exec(indexHtml)) !== null) {
      const href = m[1];
      if (/^(https?:)?\/\//.test(href)) continue;   // extern
      out.push(href.replace(/^\.\//, ''));
    }
  });
  return Array.from(new Set(out));
}

/** Alle Einträge aus STATIC_ASSETS in sw.js. */
function cachedAssets() {
  const block = swJs.slice(swJs.indexOf('STATIC_ASSETS = ['), swJs.indexOf('];'));
  const out = [];
  const re = /'\.\/([^']*)'/g;
  let m;
  while ((m = re.exec(block)) !== null) out.push(m[1]);
  return out;
}

const cached = cachedAssets();

test('alle eingebundenen Dateien stehen in der Offline-Liste', () => {
  const missing = referencedFromHtml().filter(f => !cached.includes(f));
  assert.strictEqual(missing.join(', '), '',
    'fehlt in STATIC_ASSETS von sw.js: ' + missing.join(', '));
});

test('jede Datei aus der Offline-Liste existiert wirklich', () => {
  const gone = cached
    .filter(f => f !== '' && f !== 'index.html')
    .filter(f => !fs.existsSync(path.join(ROOT, f)));
  assert.strictEqual(gone.join(', '), '', 'in sw.js gelistet, aber nicht vorhanden: ' + gone.join(', '));
});

test('alle JavaScript-Dateien des Projekts sind eingebunden', () => {
  const files = [];
  (function walk(dir) {
    fs.readdirSync(path.join(ROOT, dir)).forEach(name => {
      const rel = dir + '/' + name;
      const full = path.join(ROOT, rel);
      if (fs.statSync(full).isDirectory()) walk(rel);
      else if (name.endsWith('.js')) files.push(rel);
    });
  })('js');
  const html = referencedFromHtml();
  const missing = files.filter(f => !html.includes(f));
  assert.strictEqual(missing.join(', '), '',
    'nicht in index.html eingebunden: ' + missing.join(', '));
});

test('alle CSS-Dateien sind eingebunden', () => {
  const files = fs.readdirSync(path.join(ROOT, 'css'))
    .filter(n => n.endsWith('.css')).map(n => 'css/' + n);
  const html = referencedFromHtml();
  const missing = files.filter(f => !html.includes(f));
  assert.strictEqual(missing.join(', '), '', 'nicht eingebunden: ' + missing.join(', '));
});

test('die lokalen Schriften stehen in der Offline-Liste', () => {
  const fonts = fs.readdirSync(path.join(ROOT, 'assets/fonts'))
    .filter(n => n.endsWith('.woff2')).map(n => 'assets/fonts/' + n);
  const missing = fonts.filter(f => !cached.includes(f));
  assert.strictEqual(missing.join(', '), '', 'Schrift fehlt offline: ' + missing.join(', '));
});

test('css/fonts.css verweist nur auf lokale Dateien', () => {
  const css = read('css/fonts.css');
  assert.ok(!/https?:/.test(css), 'externe Schriftquelle in css/fonts.css');
  const urls = Array.from(css.matchAll(/url\('([^']+)'\)/g)).map(m => m[1]);
  assert.ok(urls.length >= 4, 'zu wenige Schriftdateien eingebunden');
  urls.forEach(u => {
    const rel = path.normalize(path.join('css', u));
    assert.ok(fs.existsSync(path.join(ROOT, rel)), 'fehlt: ' + rel);
  });
});

test('keine externen Dienste im HTML', () => {
  const external = Array.from(indexHtml.matchAll(/(src|href)="(https?:\/\/[^"]+)"/g)).map(m => m[2]);
  assert.strictEqual(external.join(', '), '',
    'externe Einbindung gefunden: ' + external.join(', '));
  assert.ok(!/_vercel\/insights/.test(indexHtml), 'Vercel Analytics ist noch eingebunden');
  assert.ok(!/fonts\.googleapis|fonts\.gstatic/.test(indexHtml), 'Google Fonts ist noch eingebunden');
});

test('kein CSS lädt externe Ressourcen nach', () => {
  fs.readdirSync(path.join(ROOT, 'css')).filter(n => n.endsWith('.css')).forEach(name => {
    const css = read('css/' + name);
    const external = Array.from(css.matchAll(/url\(\s*['"]?(https?:[^)'"]+)/g)).map(m => m[1]);
    assert.strictEqual(external.join(', '), '', name + ': ' + external.join(', '));
    assert.ok(!/@import\s+url\(\s*['"]?https?:/.test(css), name + ': externer @import');
  });
});

test('der Service Worker aktiviert sich nicht selbst', () => {
  const installBlock = swJs.slice(swJs.indexOf("addEventListener('install'"),
                                  swJs.indexOf("addEventListener('activate'"));
  assert.ok(!/skipWaiting\(\)/.test(installBlock),
    'skipWaiting im install-Handler würde eine laufende Übung unterbrechen');
  assert.ok(/SKIP_WAITING/.test(swJs), 'der Nachrichtenweg für ein bewusstes Update fehlt');
});

test('die Cache-Version wurde gegenüber Version 1 hochgezählt', () => {
  const m = swJs.match(/CACHE_VERSION\s*=\s*'lernwelten-v(\d+)'/);
  assert.ok(m, 'CACHE_VERSION nicht gefunden');
  assert.ok(Number(m[1]) >= 4, 'Cache-Version muss nach größeren Änderungen steigen');
});

test('pwa.js wendet ein Update nur außerhalb einer Übung an', () => {
  const pwa = read('js/pwa.js');
  assert.ok(/Session\.isActive\(\)/.test(pwa),
    'pwa.js muss prüfen, ob gerade eine Übung läuft');
  assert.ok(/reloading/.test(pwa),
    'ein controllerchange darf nur nach einem gewollten Update neu laden');
});

test('das Manifest passt zur App', () => {
  const manifest = JSON.parse(read('manifest.json'));
  assert.ok(manifest.name && manifest.short_name);
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);
  manifest.icons.forEach(icon => {
    const rel = icon.src.replace(/^\.?\//, '');
    assert.ok(fs.existsSync(path.join(ROOT, rel)), 'Icon fehlt: ' + rel);
  });
  assert.ok(!/user-scalable=no/.test(indexHtml), 'Zoom darf nicht gesperrt sein');
});
