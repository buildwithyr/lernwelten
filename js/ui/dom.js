/**
 * ui/dom.js
 * Kleine DOM-Helfer, Bildschirmwechsel, Dialoge und Ansagen.
 *
 * Zugänglichkeit (Bericht, Abschnitt 3):
 *  • Rückmeldungen werden über eine aria-live-Region angesagt.
 *  • Dialoge bekommen Fokus, Escape und eine Fokusfalle.
 *  • Jeder Bildschirmwechsel entwertet laufende Timer (siehe core/timers.js).
 */

const UI = (() => {

  const APP_ID = 'app';

  function app() { return document.getElementById(APP_ID); }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function on(sel, event, handler, root) {
    const el = typeof sel === 'string' ? $(sel, root) : sel;
    if (el) el.addEventListener(event, handler);
    return el;
  }

  function onAll(sel, event, handler, root) {
    $$(sel, root).forEach(el => el.addEventListener(event, handler));
  }

  /**
   * Ersetzt den Bildschirminhalt.
   * Entwertet vorher alle laufenden Timer und entfernt das Maskottchen.
   */
  function render(html) {
    Timers.invalidate();
    if (typeof Oskar !== 'undefined') Oskar.remove();
    const root = app();
    if (root) root.innerHTML = html;
    ensureLiveRegion();
    if (root) root.scrollTop = 0;
    if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
    return root;
  }

  // ─── Ansagen für Screenreader ─────────────────────────────────────────────

  function ensureLiveRegion() {
    if (document.getElementById('lw-live')) return;
    const el = document.createElement('div');
    el.id = 'lw-live';
    el.className = 'visually-hidden';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    document.body.appendChild(el);
  }

  function announce(text) {
    ensureLiveRegion();
    const el = document.getElementById('lw-live');
    if (!el) return;
    // Gleicher Text zweimal hintereinander wird sonst nicht angesagt.
    el.textContent = '';
    Timers.after(30, () => { el.textContent = text; });
  }

  // ─── Dialoge ──────────────────────────────────────────────────────────────

  let openOverlays = [];

  /**
   * Öffnet einen modalen Dialog.
   * @param {string} innerHtml
   * @param {object} opts { label, wide, onClose, closeOnBackdrop }
   */
  function overlay(innerHtml, opts) {
    const o = opts || {};
    const el = document.createElement('div');
    el.className = 'overlay';
    el.innerHTML = `<div class="modal${o.wide ? ' modal--wide' : ''}" role="dialog" aria-modal="true"
        aria-label="${Util.escapeAttr(o.label || 'Hinweis')}" tabindex="-1">${innerHtml}</div>`;
    document.body.appendChild(el);
    const modal = el.querySelector('.modal');
    const previouslyFocused = document.activeElement;

    function close() {
      if (!el.parentNode) return;
      el.remove();
      openOverlays = openOverlays.filter(x => x !== api);
      document.removeEventListener('keydown', keyHandler, true);
      if (previouslyFocused && previouslyFocused.focus) {
        try { previouslyFocused.focus(); } catch (e) { /* Element ist weg */ }
      }
      if (o.onClose) o.onClose();
    }

    function focusable() {
      return $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal)
        .filter(x => !x.disabled && x.offsetParent !== null);
    }

    function keyHandler(e) {
      if (openOverlays[openOverlays.length - 1] !== api) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) { e.preventDefault(); modal.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    if (o.closeOnBackdrop !== false) {
      el.addEventListener('click', e => { if (e.target === el) close(); });
    }
    document.addEventListener('keydown', keyHandler, true);

    const api = { el, modal, close };
    openOverlays.push(api);

    const first = focusable()[0];
    (first || modal).focus();
    return api;
  }

  function closeAllOverlays() {
    openOverlays.slice().forEach(o => o.close());
  }

  /** Einfache Ja/Nein-Rückfrage. */
  function confirm(question, opts) {
    const o = opts || {};
    return new Promise(resolve => {
      const ov = overlay(`
        <div class="modal-icon">${o.icon || '❓'}</div>
        <h2>${Util.escapeHtml(o.title || 'Bist du sicher?')}</h2>
        <p>${Util.escapeHtml(question)}</p>
        <div class="modal-actions">
          <button class="btn btn-primary" data-act="yes">${Util.escapeHtml(o.yes || 'Ja')}</button>
          <button class="btn btn-ghost" data-act="no">${Util.escapeHtml(o.no || 'Abbrechen')}</button>
        </div>`, { label: o.title || 'Rückfrage' });
      ov.modal.querySelector('[data-act="yes"]').addEventListener('click', () => { ov.close(); resolve(true); });
      ov.modal.querySelector('[data-act="no"]').addEventListener('click', () => { ov.close(); resolve(false); });
    });
  }

  function info(message, opts) {
    const o = opts || {};
    return overlay(`
      <div class="modal-icon">${o.icon || 'ℹ️'}</div>
      <h2>${Util.escapeHtml(o.title || 'Hinweis')}</h2>
      <p>${o.html ? message : Util.escapeHtml(message)}</p>
      <button class="btn btn-primary" data-act="ok">${Util.escapeHtml(o.ok || 'Alles klar')}</button>`,
      { label: o.title || 'Hinweis' });
  }

  // ─── Gemeinsamer Kopfbereich ──────────────────────────────────────────────

  function header(opts) {
    const o = opts || {};
    const profile = Storage.getActiveProfile();
    return `
      <header class="workshop-header">
        <button class="btn btn-back" id="back-btn" aria-label="${Util.escapeAttr(o.backLabel || 'Zurück')}">←</button>
        <div class="workshop-title-block">
          <span class="workshop-icon" aria-hidden="true">${o.icon || '🏘️'}</span>
          <h1>${Util.escapeHtml(o.title || 'Lernwelten')}</h1>
        </div>
        ${o.hideStars ? '<span class="header-spacer"></span>' : `
        <div class="star-badge" aria-label="${profile ? profile.stars : 0} Sterne">
          <span aria-hidden="true">⭐</span> <span id="header-stars">${profile ? profile.stars : 0}</span>
        </div>`}
      </header>`;
  }

  function updateStars() {
    const p = Storage.getActiveProfile();
    const el = document.getElementById('header-stars');
    if (el && p) el.textContent = p.stars;
  }

  // ─── Reduzierte Bewegung ──────────────────────────────────────────────────

  function prefersReducedMotion() {
    const p = Storage.getActiveProfile();
    if (p && p.settings && p.settings.reduceMotion) return true;
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  }

  function confetti(colors) {
    if (prefersReducedMotion()) return;
    const palette = colors || ['#F4A435', '#6DB68A', '#7EB8D4', '#B07EC8', '#E85D75', '#FFD166'];
    const container = document.createElement('div');
    container.className = 'confetti-container';
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.cssText = [
        `left:${Math.random() * 100}%`,
        `background:${palette[Math.floor(Math.random() * palette.length)]}`,
        `animation-delay:${(Math.random() * 0.9).toFixed(2)}s`,
        `animation-duration:${(1.2 + Math.random() * 1.4).toFixed(2)}s`,
        `width:${6 + Math.round(Math.random() * 8)}px`,
        `height:${6 + Math.round(Math.random() * 8)}px`,
        `border-radius:${Math.random() > 0.5 ? '50%' : '3px'}`,
      ].join(';');
      container.appendChild(piece);
    }
    Timers.after(3500, () => container.remove());
  }

  // ─── Speicherfehler sichtbar machen ───────────────────────────────────────

  let storageBannerShown = false;

  function showStorageProblem(err) {
    if (storageBannerShown) return;
    storageBannerShown = true;
    const text = err && err.kind === 'quota'
      ? 'Der Speicher deines Browsers ist voll. Der Lernstand konnte nicht gesichert werden. Ein Erwachsener kann im Elternbereich eine Sicherung herunterladen und Platz schaffen.'
      : 'Der Lernstand konnte gerade nicht gespeichert werden. Bitte prüfe, ob dein Browser Daten speichern darf (im privaten Modus geht das oft nicht).';
    const bar = document.createElement('div');
    bar.className = 'storage-warning';
    bar.setAttribute('role', 'alert');
    bar.innerHTML = `
      <span class="sw-icon" aria-hidden="true">⚠️</span>
      <span class="sw-text">${Util.escapeHtml(text)}</span>
      <button class="sw-close" aria-label="Hinweis schließen">✕</button>`;
    document.body.appendChild(bar);
    bar.querySelector('.sw-close').addEventListener('click', () => {
      bar.remove();
      storageBannerShown = false;
    });
  }

  return {
    app, $, $$, on, onAll, render, announce, ensureLiveRegion,
    overlay, closeAllOverlays, confirm, info,
    header, updateStars, prefersReducedMotion, confetti, showStorageProblem,
  };
})();
