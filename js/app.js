/**
 * Main Application Orchestrator (Quit Smoking Edition)
 */

import { Storage } from './storage.js';
import { Tracker } from './tracker.js';
import { StatsView } from './stats.js';
import { BadgesManager } from './badges.js';
import { Sound } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // 1. Initialize Tracker UI and timer
  Tracker.init();

  // 2. Setup Navigation Tabs
  setupNavigation();

  // 3. Setup Settings Form
  setupSettings();

  // 4. Setup Wishlist Form
  StatsView.setupWishlistForm();

  // 5. Setup Achievement Modal Close
  setupAchievementModal();

  // 6. Setup Share App
  setupShareApp();

  // 7. Register Service Worker & PWA Install
  setupPWA();

  // 8. Custom update events
  window.addEventListener('stats_updated', () => {
    Tracker.updateUI();
    StatsView.renderAll();
  });

  // Initial render of Health and Finance/Wishlist
  StatsView.renderAll();
}

function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      navBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById(targetTab);
      if (targetEl) {
        targetEl.classList.add('active');
        // Refresh views on tab open
        if (targetTab === 'tab-health' || targetTab === 'tab-finance') {
          StatsView.renderAll();
        }
      }
    });
  });
}

function setupSettings() {
  const form = document.getElementById('settings-form');
  const quitInput = document.getElementById('setting-quit-datetime');
  const setNowBtn = document.getElementById('setting-set-now-btn');
  const dailyCigsInput = document.getElementById('setting-daily-cigs');
  const priceInput = document.getElementById('setting-pack-price');
  const currencyInput = document.getElementById('setting-currency');
  const perPackInput = document.getElementById('setting-per-pack');
  const soundToggle = document.getElementById('setting-sound');
  const hapticToggle = document.getElementById('setting-haptic');
  const saveMsg = document.getElementById('settings-save-success');
  const resetAllBtn = document.getElementById('reset-data-btn');

  // Load current values
  const current = Storage.getSettings();
  const currentQuit = Storage.getQuitTime();

  if (quitInput) {
    quitInput.value = Tracker.toLocalISOString(new Date(currentQuit));
  }

  if (setNowBtn) {
    setNowBtn.addEventListener('click', () => {
      if (quitInput) quitInput.value = Tracker.toLocalISOString(new Date());
    });
  }

  if (dailyCigsInput) dailyCigsInput.value = current.dailyCigarettes || 20;
  if (priceInput) priceInput.value = current.packPrice || 450;
  if (currencyInput) currencyInput.value = current.currency || 'RSD';
  if (perPackInput) perPackInput.value = current.perPack || 20;
  if (soundToggle) soundToggle.checked = current.soundEnabled !== false;
  if (hapticToggle) hapticToggle.checked = current.hapticEnabled !== false;

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (quitInput && quitInput.value) {
        const parsedDate = new Date(quitInput.value);
        if (!isNaN(parsedDate.getTime())) {
          Storage.setQuitTime(parsedDate.getTime());
        }
      }

      const cleanPrice = parseFloat(String(priceInput.value).replace(',', '.')) || 450;

      const updated = {
        dailyCigarettes: parseInt(dailyCigsInput.value, 10) || 20,
        packPrice: cleanPrice,
        currency: currencyInput.value.trim() || 'RSD',
        perPack: parseInt(perPackInput.value, 10) || 20,
        soundEnabled: soundToggle.checked,
        hapticEnabled: hapticToggle.checked
      };

      Storage.saveSettings(updated);

      if (saveMsg) {
        saveMsg.classList.add('visible');
        setTimeout(() => saveMsg.classList.remove('visible'), 2800);
      }

      if (updated.soundEnabled) Sound.playClick();
      if (updated.hapticEnabled) Sound.triggerHaptic('light');

      Tracker.updateUI();
      StatsView.renderAll();
    });
  }

  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      if (confirm('Da li si siguran da želiš da resetuješ sve podatke i kreneš ispočetka?')) {
        Storage.resetAllData();
        if (quitInput) quitInput.value = Tracker.toLocalISOString(new Date());
        Tracker.updateUI();
        StatsView.renderAll();
        alert('Podaci su uspešno resetovani. Nova pobeda kreće od sada!');
      }
    });
  }
}

function setupAchievementModal() {
  const modal = document.getElementById('achievement-modal');
  const closeBtn = document.getElementById('close-achievement-modal');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }
}

function setupShareApp() {
  const shareBtn = document.getElementById('share-app-btn');
  const copyBtn = document.getElementById('copy-link-btn');

  const shareData = {
    title: 'Smoke Free — Aplikacija za prestanak pušenja',
    text: 'Baci cigarete i prati svoj oporavak uz ovu besplatnu aplikaciju!',
    url: window.location.href
  };

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareData.url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareData.url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      Tracker.showToast('📋 Link je kopiran! Pošalji ga prijatelju.');
      Sound.playClick();
    } catch (e) {
      Tracker.showToast('Kopiraj link: ' + shareData.url);
    }
  };

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          if (err.name !== 'AbortError') {
            copyToClipboard();
          }
        }
      } else {
        copyToClipboard();
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      copyToClipboard();
    });
  }
}

function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.warn('SW failed:', err));
    });
  }

  // PWA Install prompt handling
  let deferredPrompt;
  const installBanner = document.getElementById('pwa-install-banner');
  const installBtn = document.getElementById('pwa-install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) installBanner.classList.add('visible');
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      installBanner.classList.remove('visible');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('User install outcome:', outcome);
      deferredPrompt = null;
    });
  }
}
