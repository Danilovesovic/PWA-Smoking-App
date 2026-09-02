/**
 * Tracker Screen Logic
 * Handles the main SMOKE button, live smoke-free timer, and real-time UI counters.
 */

import { Storage } from './storage.js';
import { Sound } from './audio.js';
import { BadgesManager } from './badges.js';

let timerInterval = null;

export const Tracker = {
  init() {
    this.bindEvents();
    this.updateUI();
    this.startTimerLoop();
  },

  bindEvents() {
    const smokeBtn = document.getElementById('smoke-action-btn');
    const undoBtn = document.getElementById('undo-toast-btn');
    const closeUndoBtn = document.getElementById('undo-toast-close');

    if (smokeBtn) {
      smokeBtn.addEventListener('click', (e) => {
        this.handleSmokeClick(e);
      });
    }

    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        this.handleUndoClick();
      });
    }

    if (closeUndoBtn) {
      closeUndoBtn.addEventListener('click', () => {
        this.hideUndoToast();
      });
    }
  },

  handleSmokeClick(e) {
    const settings = Storage.getSettings();

    // Sound & Haptics
    if (settings.soundEnabled) {
      Sound.playClick();
    }
    if (settings.hapticEnabled) {
      Sound.triggerHaptic('medium');
    }

    // Save log entry
    Storage.addLog();

    // Visual button ripple effect
    const btn = document.getElementById('smoke-action-btn');
    if (btn) {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 250);
    }

    // Update UI components
    this.updateUI();
    this.showUndoToast();

    // Check badges
    BadgesManager.checkAchievements();

    // Notify custom event for stats page if open
    window.dispatchEvent(new CustomEvent('smoke_logged'));
  },

  handleUndoClick() {
    const removed = Storage.undoLastLog();
    if (removed) {
      const settings = Storage.getSettings();
      if (settings.soundEnabled) Sound.playUndo();
      if (settings.hapticEnabled) Sound.triggerHaptic('undo');

      this.hideUndoToast();
      this.updateUI();
      window.dispatchEvent(new CustomEvent('smoke_logged'));
    }
  },

  showUndoToast() {
    const toast = document.getElementById('undo-toast');
    if (!toast) return;

    toast.classList.add('visible');
    
    // Auto hide after 7 seconds
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.undoTimer = setTimeout(() => {
      this.hideUndoToast();
    }, 7000);
  },

  hideUndoToast() {
    const toast = document.getElementById('undo-toast');
    if (toast) toast.classList.remove('visible');
  },

  startTimerLoop() {
    if (timerInterval) clearInterval(timerInterval);

    const tick = () => {
      this.updateTimerDisplay();
      // Periodic check for badges every minute
      BadgesManager.checkAchievements();
    };

    tick();
    timerInterval = setInterval(tick, 1000);
  },

  updateTimerDisplay() {
    const timerValueEl = document.getElementById('timer-val');
    const timerUnitEl = document.getElementById('timer-subtext');
    const nextBadgeBox = document.getElementById('next-badge-info');

    const lastSmoke = Storage.getLastSmokeTime();

    if (!lastSmoke) {
      if (timerValueEl) timerValueEl.textContent = '00:00:00';
      if (timerUnitEl) timerUnitEl.textContent = 'Pritisni SMOKE za prvi unos';
      return;
    }

    const diffMs = Math.max(0, Date.now() - lastSmoke);
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');

    if (timerValueEl) {
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        timerValueEl.textContent = `${days}d ${pad(remHours)}h ${pad(minutes)}m`;
      } else {
        timerValueEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      }
    }

    if (timerUnitEl) {
      timerUnitEl.textContent = 'vreme bez cigarete';
    }

    // Update Next Milestone progress on Tracker screen
    const nextBadge = BadgesManager.getNextMilestone();
    if (nextBadge && nextBadgeBox) {
      const nextTitleEl = document.getElementById('next-badge-title');
      const nextBarEl = document.getElementById('next-badge-bar');
      const nextTimeEl = document.getElementById('next-badge-time');

      if (nextTitleEl) nextTitleEl.textContent = `${nextBadge.icon} ${nextBadge.title}`;
      if (nextBarEl) nextBarEl.style.width = `${nextBadge.progressPercent}%`;
      if (nextTimeEl) {
        const remH = Math.floor(nextBadge.remainingMinutes / 60);
        const remM = nextBadge.remainingMinutes % 60;
        let timeStr = '';
        if (remH > 0) timeStr += `${remH}h `;
        timeStr += `${remM}m do otključavanja`;
        nextTimeEl.textContent = timeStr;
      }
    }
  },

  updateUI() {
    const todayLogs = Storage.getTodayLogs();
    const settings = Storage.getSettings();

    // Today count
    const todayCountEl = document.getElementById('today-smoke-count');
    if (todayCountEl) {
      todayCountEl.textContent = todayLogs.length;
    }

    // Today cost calculation
    const todayCostEl = document.getElementById('today-cost-val');
    if (todayCostEl) {
      const pricePerCig = settings.packPrice / (settings.perPack || 20);
      const todayCost = (todayLogs.length * pricePerCig).toFixed(0);
      todayCostEl.textContent = `${todayCost} ${settings.currency}`;
    }

    this.updateTimerDisplay();
  }
};
