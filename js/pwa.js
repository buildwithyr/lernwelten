/**
 * Lernwelten PWA — Service Worker Registration & Install Prompt
 *
 * Zuständigkeiten:
 *  - Service Worker registrieren
 *  - Install-Banner für iOS und Android anzeigen
 *  - localStorage niemals löschen
 */

(function () {
  'use strict';

  // ── Konstanten ─────────────────────────────────────────────────────────────

  var INSTALL_DISMISSED_KEY = 'lw_pwa_install_dismissed';

  // ── Service Worker ──────────────────────────────────────────────────────────

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      // Merken, ob diese Seite schon VOR der Registrierung von einem Service
      // Worker kontrolliert wurde. Nur dann ist ein späterer controllerchange
      // ein echtes Update (alte Version → neue Version). Beim allerersten
      // Besuch gibt es noch keinen Controller — hier soll NICHT neu geladen
      // werden, das würde jedem Erstbesucher einen ungefragten Reload zeigen.
      var hadController = !!navigator.serviceWorker.controller;

      navigator.serviceWorker
        .register('./sw.js', { scope: './' })
        .then(function (reg) {
          // Auf neue Version prüfen
          reg.addEventListener('updatefound', function () {
            var newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', function () {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Neue Version bereit — automatisch im Hintergrund aktivieren.
                // localStorage bleibt vollständig erhalten.
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });
        })
        .catch(function (err) {
          console.warn('[PWA] Service Worker konnte nicht registriert werden:', err);
        });

      // Seite nur neu laden, wenn eine bereits aktive Version durch eine neue
      // ersetzt wird — nicht bei der allerersten Aktivierung des Service Workers.
      var refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hadController || refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    });
  }

  // ── Install-Banner ──────────────────────────────────────────────────────────

  var banner    = document.getElementById('pwa-install-banner');
  var hint      = document.getElementById('pwa-install-hint');
  var installBtn = document.getElementById('pwa-install-btn');
  var closeBtn  = document.getElementById('pwa-install-close');

  if (!banner || !hint || !installBtn || !closeBtn) return;

  // Bereits installiert oder dismissed → nicht anzeigen
  function isInstalled() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  function wasDismissed() {
    try { return localStorage.getItem(INSTALL_DISMISSED_KEY) === '1'; } catch (e) { return false; }
  }

  function dismiss() {
    try { localStorage.setItem(INSTALL_DISMISSED_KEY, '1'); } catch (e) {}
    banner.classList.remove('visible');
  }

  closeBtn.addEventListener('click', dismiss);

  // Android: BeforeInstallPrompt
  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;

    if (isInstalled() || wasDismissed()) return;

    hint.textContent = 'Tippe auf "Installieren", um die App zum Home-Bildschirm hinzuzufügen.';
    installBtn.style.display = 'inline-block';
    banner.classList.add('visible');
  });

  installBtn.addEventListener('click', function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choice) {
      if (choice.outcome === 'accepted') {
        dismiss();
      }
      deferredPrompt = null;
    });
  });

  // iOS: kein beforeinstallprompt — Hinweis für Safari zeigen
  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }

  function isIOSSafari() {
    return isIOS() && /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
  }

  if (isIOSSafari() && !isInstalled() && !wasDismissed()) {
    hint.textContent = 'Tippe auf ⎋ Teilen und dann auf „Zum Home-Bildschirm".';
    installBtn.style.display = 'none';
    // Kurz verzögert anzeigen, damit die App zuerst laden kann
    setTimeout(function () {
      if (!isInstalled()) banner.classList.add('visible');
    }, 3000);
  }

  // Nach erfolgreicher Installation Banner entfernen
  window.addEventListener('appinstalled', function () {
    dismiss();
  });

})();
