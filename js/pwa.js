/**
 * pwa.js
 * Service Worker, Updates und Installationshinweis.
 *
 * Behebt zwei Befunde aus Abschnitt 3 des Berichts:
 *   • Ein Update lädt die Seite nicht mehr mitten in einer Übung neu.
 *     Die neue Version wartet, bis eine Runde fertig ist oder der Dorfplatz
 *     offen ist, und wird erst nach einem Tippen übernommen.
 *   • Der Installationshinweis erscheint erst nach einer abgeschlossenen
 *     Runde — nicht mehr während der ersten Übung.
 */

const PWA = (() => {
  'use strict';

  var INSTALL_DISMISSED_KEY = 'lw_pwa_install_dismissed';
  var ROUNDS_BEFORE_HINT = 1;

  var waitingWorker = null;
  var updateBannerShown = false;
  var reloading = false;
  var deferredPrompt = null;
  var roundsThisVisit = 0;

  // ─── Service Worker ────────────────────────────────────────────────────────

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    var hadController = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(function (reg) {
        if (reg.waiting && hadController) noteUpdate(reg.waiting);

        reg.addEventListener('updatefound', function () {
          var fresh = reg.installing;
          if (!fresh) return;
          fresh.addEventListener('statechange', function () {
            if (fresh.state === 'installed' && navigator.serviceWorker.controller) {
              noteUpdate(fresh);
            }
          });
        });
      })
      .catch(function (err) {
        console.warn('[PWA] Service Worker konnte nicht registriert werden:', err);
      });

    // Neu laden nur, wenn WIR das Update angestoßen haben.
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!reloading) return;
      window.location.reload();
    });
  }

  /** Merkt sich die wartende Version und zeigt sie an, sobald es passt. */
  function noteUpdate(worker) {
    waitingWorker = worker;
    maybeShowUpdateBanner();
  }

  function safeToUpdate() {
    return !(typeof Session !== 'undefined' && Session.isActive());
  }

  function maybeShowUpdateBanner() {
    if (!waitingWorker || updateBannerShown || !safeToUpdate()) return;
    updateBannerShown = true;

    var bar = document.createElement('div');
    bar.className = 'update-banner';
    bar.setAttribute('role', 'status');
    bar.innerHTML =
      '<span class="ub-icon" aria-hidden="true">✨</span>' +
      '<span class="ub-text">Es gibt eine neue Version von Lernwelten.</span>' +
      '<button class="ub-apply" type="button">Jetzt laden</button>' +
      '<button class="ub-later" type="button" aria-label="Später">Später</button>';
    document.body.appendChild(bar);

    bar.querySelector('.ub-apply').addEventListener('click', function () {
      if (!waitingWorker) { window.location.reload(); return; }
      reloading = true;
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      bar.remove();
    });
    bar.querySelector('.ub-later').addEventListener('click', function () {
      bar.remove();
      updateBannerShown = false;   // beim nächsten passenden Zeitpunkt wieder anbieten
    });
  }

  // ─── Installationshinweis ──────────────────────────────────────────────────

  function isInstalled() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }

  function wasDismissed() {
    try { return localStorage.getItem(INSTALL_DISMISSED_KEY) === '1'; } catch (e) { return false; }
  }

  function hintAllowed() {
    if (isInstalled() || wasDismissed()) return false;
    if (roundsThisVisit < ROUNDS_BEFORE_HINT) return false;
    try {
      var p = Storage.getActiveProfile();
      if (p && p.settings && p.settings.showInstallHint === false) return false;
    } catch (e) { /* Profil noch nicht geladen */ }
    return true;
  }

  function dismissInstall() {
    try { localStorage.setItem(INSTALL_DISMISSED_KEY, '1'); } catch (e) { /* egal */ }
    var banner = document.getElementById('pwa-install-banner');
    if (banner) banner.classList.remove('visible');
  }

  function showInstallBanner() {
    if (!hintAllowed()) return;
    var banner = document.getElementById('pwa-install-banner');
    var hint = document.getElementById('pwa-install-hint');
    var installBtn = document.getElementById('pwa-install-btn');
    if (!banner || !hint || !installBtn) return;

    if (deferredPrompt) {
      hint.textContent = 'Tippe auf „Installieren", um Lernwelten zum Home-Bildschirm hinzuzufügen.';
      installBtn.style.display = 'inline-block';
    } else if (isIOSSafari()) {
      hint.textContent = 'Tippe unten auf „Teilen" und dann auf „Zum Home-Bildschirm".';
      installBtn.style.display = 'none';
    } else {
      return;
    }
    banner.classList.add('visible');
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }
  function isIOSSafari() {
    return isIOS() && /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
  }

  /** Wird von der Sitzungssteuerung nach jeder abgeschlossenen Runde gerufen. */
  function onRoundFinished() {
    roundsThisVisit++;
    maybeShowUpdateBanner();
    setTimeout(showInstallBanner, 1500);
  }

  /** Wird vom Dorfplatz gerufen — auch dort darf ein Update kommen. */
  function onVillage() {
    maybeShowUpdateBanner();
  }

  // ─── Start ─────────────────────────────────────────────────────────────────

  function init() {
    registerServiceWorker();

    var closeBtn = document.getElementById('pwa-install-close');
    if (closeBtn) closeBtn.addEventListener('click', dismissInstall);

    var installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (choice) {
          if (choice.outcome === 'accepted') dismissInstall();
          deferredPrompt = null;
        });
      });
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      showInstallBanner();
    });

    window.addEventListener('appinstalled', dismissInstall);
  }

  window.addEventListener('load', init);

  return { onRoundFinished, onVillage, showInstallBanner, maybeShowUpdateBanner };
})();
