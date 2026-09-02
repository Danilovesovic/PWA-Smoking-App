/**
 * Main Application Orchestrator
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

  // 4. Setup Manual Log Modal
  setupManualLogModal();

  // 5. Setup Achievement Modal Close
  setupAchievementModal();

  // 6. Setup Data Export & Import
  setupBackupRestore();

  // 7. Register Service Worker & PWA Install
  setupPWA();

  // 8. Listen to custom updates
  window.addEventListener('smoke_logged', () => {
    Tracker.updateUI();
    StatsView.renderAll();
  });

  // Initial render of stats/badges
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
        if (targetTab === 'tab-badges' || targetTab === 'tab-logs' || targetTab === 'tab-stats') {
          StatsView.renderAll();
        }
      }
    });
  });
}

function setupSettings() {
  const form = document.getElementById('settings-form');
  const priceInput = document.getElementById('setting-pack-price');
  const currencyInput = document.getElementById('setting-currency');
  const perPackInput = document.getElementById('setting-per-pack');
  const soundToggle = document.getElementById('setting-sound');
  const hapticToggle = document.getElementById('setting-haptic');
  const saveBtn = document.getElementById('save-settings-btn');
  const saveMsg = document.getElementById('settings-save-success');

  // Load current values
  const current = Storage.getSettings();
  if (priceInput) priceInput.value = current.packPrice || 420;
  if (currencyInput) currencyInput.value = current.currency || 'RSD';
  if (perPackInput) perPackInput.value = current.perPack || 20;
  if (soundToggle) soundToggle.checked = current.soundEnabled !== false;
  if (hapticToggle) hapticToggle.checked = current.hapticEnabled !== false;

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = {
        packPrice: parseFloat(priceInput.value) || 420,
        currency: currencyInput.value.trim() || 'RSD',
        perPack: parseInt(perPackInput.value, 10) || 20,
        soundEnabled: soundToggle.checked,
        hapticEnabled: hapticToggle.checked
      };

      Storage.saveSettings(updated);
      Tracker.updateUI();
      StatsView.renderAll();

      if (saveMsg) {
        saveMsg.classList.add('show');
        setTimeout(() => saveMsg.classList.remove('show'), 2500);
      }
    });
  }
}

function setupManualLogModal() {
  const modal = document.getElementById('manual-entry-modal');
  const openBtn = document.getElementById('open-manual-log-btn');
  const closeBtn = document.getElementById('close-manual-modal');
  const form = document.getElementById('manual-log-form');
  const timeInput = document.getElementById('manual-datetime');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      // Set default to current local time formatted for datetime-local
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      if (timeInput) timeInput.value = now.toISOString().slice(0, 16);
      modal.classList.add('active');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (form && modal) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const dtValue = timeInput ? timeInput.value : null;
      const noteInput = document.getElementById('manual-note');
      const note = noteInput ? noteInput.value.trim() : '';

      const timestamp = dtValue ? new Date(dtValue).getTime() : Date.now();
      Storage.addLog(timestamp, note);
      
      modal.classList.remove('active');
      if (noteInput) noteInput.value = '';
      
      Tracker.updateUI();
      StatsView.renderAll();
      BadgesManager.checkAchievements();
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
  }
}

function setupBackupRestore() {
  const exportBtn = document.getElementById('export-data-btn');
  const importFileInput = document.getElementById('import-file-input');
  const resetBtn = document.getElementById('reset-data-btn');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(Storage.exportData());
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", `smoke_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`);
      dlAnchorElem.click();
    });
  }

  if (importFileInput) {
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const success = Storage.importData(event.target.result);
        if (success) {
          alert('Podaci su uspešno uvezeni!');
          location.reload();
        } else {
          alert('Greška pri uvozu fajla. Proveri format JSON fajla.');
        }
      };
      reader.readAsText(file);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Da li si siguran da želiš da obrišeš sve podatke? Ova radnja se ne može poništiti.')) {
        Storage.clearAllData();
        location.reload();
      }
    });
  }
}

function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('ServiceWorker registered:', reg.scope))
        .catch(err => console.log('ServiceWorker registration failed:', err));
    });
  }

  // Handle install prompt for Android
  let deferredPrompt;
  const installBanner = document.getElementById('pwa-install-banner');
  const installBtn = document.getElementById('pwa-install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) installBanner.style.display = 'flex';
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        if (installBanner) installBanner.style.display = 'none';
      }
      deferredPrompt = null;
    });
  }
}
