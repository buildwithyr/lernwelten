/**
 * tests/harness.js
 * Lädt die Browser-Module (IIFE-Globals) in einen Node-Kontext.
 *
 * Die App hat bewusst keinen Build-Schritt. Für Tests werden die Dateien
 * daher in derselben Reihenfolge wie in index.html in einen vm-Kontext
 * eingelesen. Ein einfacher localStorage-Ersatz macht Storage testbar.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

/** Minimaler localStorage-Ersatz mit optionalem Kontingentlimit. */
function makeMemoryStorage(options) {
  const opts = options || {};
  const data = new Map();
  return {
    _data: data,
    get length() { return data.size; },
    key(i) { return Array.from(data.keys())[i]; },
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) {
      if (opts.readOnly) {
        const err = new Error('storage is read-only');
        err.name = 'QuotaExceededError';
        throw err;
      }
      if (opts.maxBytes) {
        let size = 0;
        data.forEach((val, key) => { size += key.length + val.length; });
        if (size + k.length + String(v).length > opts.maxBytes) {
          const err = new Error('quota exceeded');
          err.name = 'QuotaExceededError';
          throw err;
        }
      }
      data.set(k, String(v));
    },
    removeItem(k) { data.delete(k); },
    clear() { data.clear(); },
  };
}

/** Reihenfolge entspricht index.html (Kernmodule ohne DOM-Abhängigkeit). */
const CORE_FILES = [
  'js/core/util.js',
  'js/core/topics.js',
  'js/core/answer.js',
  'js/core/storage.js',
  'js/core/progress.js',
  'js/core/rewards.js',
  'js/content/words-data.js',
  'js/content/german-data.js',
  'js/content/science-data.js',
  'js/content/logic-data.js',
  'js/ui/clock.js',
  'js/ui/widgets.js',
  'js/generators/math-gen.js',
  'js/generators/german-gen.js',
  'js/generators/misc-gen.js',
  'js/generators/index.js',
];

/**
 * Baut einen frischen App-Kontext.
 * @param {object} options { files, storage, silent }
 */
function loadApp(options) {
  const opts = options || {};
  const files = opts.files || CORE_FILES;
  const storage = opts.storage || makeMemoryStorage(opts.storageOptions);

  const sandbox = {
    localStorage: storage,
    console: opts.silent
      ? { log() {}, warn() {}, error() {}, info() {} }
      : console,
    setTimeout, clearTimeout, setInterval, clearInterval,
    Date, Math, JSON, Number, String, Array, Object, Boolean, RegExp, Error,
    Set, Map, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const context = vm.createContext(sandbox);

  files.forEach(rel => {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) throw new Error('Datei fehlt: ' + rel);
    const code = fs.readFileSync(full, 'utf8');
    try {
      vm.runInContext(code, context, { filename: rel });
    } catch (err) {
      err.message = `${rel}: ${err.message}`;
      throw err;
    }
  });

  // `const Foo = ...` auf oberster Ebene landet im lexikalischen Gültigkeits-
  // bereich des Kontexts, nicht auf globalThis. Für Tests holen wir die
  // Module deshalb ausdrücklich heraus.
  const NAMES = [
    'Util', 'Topics', 'AnswerCheck', 'Storage', 'Progress', 'Rewards',
    'WordsData', 'GermanData', 'ScienceData', 'LogicData',
    'Clock', 'Widgets', 'MathGen', 'GermanGen', 'MiscGen', 'Generators',
    'Session', 'Toolbox', 'Worksheet', 'Daily',
  ];
  NAMES.forEach(name => {
    try {
      const value = vm.runInContext(`typeof ${name} !== 'undefined' ? ${name} : undefined`, context);
      if (value !== undefined) context[name] = value;
    } catch (e) { /* Modul nicht geladen */ }
  });

  context.__storage = storage;
  context.evalIn = (expr) => vm.runInContext(expr, context);
  return context;
}

module.exports = { loadApp, makeMemoryStorage, ROOT, CORE_FILES };
