(() => {
  'use strict';
  const BASE = '/prof-mnl.snv/';
  let deferredPrompt = null;
  let installButton = null;

  function createInstallButton() {
    if (installButton || window.matchMedia('(display-mode: standalone)').matches) return;
    installButton = document.createElement('button');
    installButton.type = 'button';
    installButton.className = 'pwa-install-btn';
    installButton.innerHTML = '<i class="fas fa-download" aria-hidden="true"></i><span>تثبيت التطبيق</span>';
    installButton.setAttribute('aria-label', 'تثبيت تطبيق علوم الطبيعة');
    installButton.hidden = true;
    installButton.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installButton.hidden = true;
    });
    document.body.appendChild(installButton);
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.register(BASE + 'service-worker.js', { scope: BASE });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage('SKIP_WAITING');
          }
        });
      });
    } catch (error) {
      console.warn('PWA registration failed:', error);
    }
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    createInstallButton();
    installButton.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (installButton) installButton.hidden = true;
  });

  document.addEventListener('DOMContentLoaded', () => {
    createInstallButton();
    registerServiceWorker();
  }, { once: true });
})();