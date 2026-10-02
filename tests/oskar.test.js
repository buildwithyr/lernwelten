'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function fixture() {
  let reduced = false;
  const callbacks = new Set();
  const delays = new Set();
  const pauses = [];
  const listeners = new Map();
  const sprite = { style: {}, dataset: {}, classList: { add() {} } };
  const bubble = { textContent: '', classList: { add() {}, remove() {} } };
  const button = { disabled: false, addEventListener(_, fn) { this.click = fn; } };
  const el = { dataset: {}, isConnected: true, setAttribute() {}, remove() { this.isConnected = false; },
    querySelector(selector) { return selector === '.oskar-sprite' ? sprite : selector === '.oskar-bubble' ? bubble : button; } };
  const media = { addEventListener(_, fn) { listeners.set('motion', fn); }, removeEventListener() { listeners.delete('motion'); } };
  const document = { hidden: false, createElement() { el.isConnected = true; return el; },
    addEventListener(event, fn) { listeners.set(event, fn); }, removeEventListener(event) { listeners.delete(event); } };
  const ctx = vm.createContext({ document, window: { matchMedia: () => media },
    UI: { prefersReducedMotion: () => reduced },
    Image: class { complete = true; naturalWidth = 1536; addEventListener() {} },
    Timers: {
      every(_, fn) { callbacks.add(fn); return () => callbacks.delete(fn); },
      after(ms, fn) { pauses.push(ms); delays.add(fn); return () => delays.delete(fn); },
    } });
  vm.runInContext(fs.readFileSync('js/oskar.js', 'utf8') + '\nthis.pet = Oskar;', ctx);
  return { pet: ctx.pet, sprite, bubble, button, listeners, callbacks, delays, pauses, document,
    pose() { return el.dataset.pose; },
    container: { appendChild() {} }, reduce(value) { reduced = value; listeners.get('motion')?.(); },
    tick() { [...callbacks].forEach(fn => fn()); },
    idle() { [...delays].forEach(fn => { delays.delete(fn); fn(); }); } };
}

test('Oskar rests while solving, delegates hints, and stops after a short success reaction', () => {
  const f = fixture(); let hints = 0;
  f.pet.show(f.container, { animate: false, onHelp: () => hints++ });
  assert.equal(f.callbacks.size, 0);
  f.button.click(); assert.equal(hints, 1);
  f.pet.react('happy', 'Du hast die Aufgabe gelöst!');
  assert.equal(f.sprite.dataset.row, '4');
  assert.equal(f.bubble.textContent, 'Du hast die Aufgabe gelöst!');
  for (let i = 0; i < 5; i++) f.tick();
  assert.equal(f.sprite.dataset.row, '0');
  assert.equal(f.callbacks.size, 0);
  f.pet.setHelpEnabled(false); assert.equal(f.button.disabled, true);
});

test('Reduced motion preserves feedback but no animation; leaving clears timers and listeners', () => {
  const f = fixture(); f.pet.show(f.container, { pose: 'wave' });
  assert.equal(f.callbacks.size, 1);
  f.reduce(true); assert.equal(f.callbacks.size, 0);
  f.pet.react('thinking', 'Schau dir den Tipp in Ruhe an.');
  assert.equal(f.sprite.dataset.row, '0'); assert.equal(f.sprite.dataset.frame, '0');
  assert.match(f.bubble.textContent, /Tipp/);
  f.reduce(false); assert.equal(f.callbacks.size, 1);
  f.document.hidden = true; f.listeners.get('visibilitychange')();
  assert.equal(f.callbacks.size, 0);
  f.pet.remove(); assert.equal(f.listeners.size, 0);
});

test('Menu motions use all original gaze directions and stop on navigation or reduced motion', () => {
  const f = fixture();
  f.pet.show(f.container, { pose: 'look' });
  assert.equal(f.sprite.dataset.row, '9');
  for (let i = 0; i < 8; i++) f.tick();
  assert.equal(f.sprite.dataset.row, '10');
  assert.equal(f.sprite.dataset.frame, '0');
  for (let i = 0; i < 8; i++) f.tick();
  assert.equal(f.callbacks.size, 0);
  assert.equal(f.delays.size, 1);
  f.reduce(true);
  assert.equal(f.delays.size, 0);
  f.reduce(false);
  for (let i = 0; i < 6; i++) f.tick();
  f.pet.remove();
  assert.equal(f.callbacks.size + f.delays.size, 0);
  assert.equal(f.listeners.size, 0);
});

test('Idle motion rounds include every variant without consecutive repeats', () => {
  const f = fixture();
  f.pet.show(f.container, { pose: 'wave' });
  const finish = () => { for (let i = 0; i < 32 && f.callbacks.size; i++) f.tick(); };
  finish();
  let previous = 'wave';
  const expected = ['default', 'look', 'runRight', 'runLeft', 'wave', 'happy',
    'paw', 'curious', 'lookLeft', 'lookRight', 'lookUp', 'lookDown'].sort();
  for (let round = 0; round < 3; round++) {
    const seen = [];
    for (let i = 0; i < 12; i++) {
      f.idle();
      const pose = f.pose();
      assert.notEqual(pose, previous);
      seen.push(pose); previous = pose;
      finish();
      assert.equal(f.delays.size, 1);
    }
    assert.deepEqual(seen.sort(), expected);
  }
  assert.ok(f.pauses.every(ms => ms >= 2800 && ms < 5500));
  f.pet.remove();
  assert.equal(f.callbacks.size + f.delays.size, 0);
});

test('Running repeats the same row, and tasks never schedule ambient movements', () => {
  const f = fixture();
  f.pet.show(f.container, { placement: 'task-companion', pose: 'runRight' });
  for (let i = 0; i < 8; i++) f.tick();
  assert.equal(f.sprite.dataset.row, '1');
  assert.equal(f.sprite.dataset.frame, '0');
  for (let i = 0; i < 8; i++) f.tick();
  assert.equal(f.sprite.dataset.row, '0');
  assert.equal(f.callbacks.size + f.delays.size, 0);
});
