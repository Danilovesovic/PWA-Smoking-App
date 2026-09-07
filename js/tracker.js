/**
 * Tracker / Dashboard Logic (Quit Smoking Edition)
 * Controls the live smoke-free timer, SOS craving breathing guide, and stats counters.
 */

import { Storage } from './storage.js';
import { Sound } from './audio.js';
import { BadgesManager } from './badges.js';
import { fireConfetti } from './confetti.js';

let timerInterval = null;
let breathingInterval = null;
let breathingTimeout = null;

const CRAVING_TIPS = [
  'Popij veliku čašu hladne vode polako, gutljaj po gutljaj.',
  'Želja za nikotinom traje u proseku samo 3 do 5 minuta. Već prolazi!',
  'Udari 10 brzih čučnjeva ili se protegni — fizička promena prekida mentalni impuls.',
  'Seti se zašto si prestao: tvoja pluća i srce ti se već zahvaljuju.',
  'Operi zube ili uzmi pepermint žvaku — svež ukus u ustima ubija želju za dimom.',
  'Pozovi blisku osobu ili skreni misli na 2 minuta gledanjem omiljenog videa.',
  'Svaka kriza koju izdržiš trajno uništava zavisničke receptore u mozgu.'
];

export const Tracker = {
  init() {
    this.bindEvents();
    this.updateUI();
    this.startTimerLoop();
  },

  bindEvents() {
    // SOS Button
    const sosBtn = document.getElementById('sos-action-btn');
    if (sosBtn) {
      sosBtn.addEventListener('click', () => {
        this.openSosModal();
      });
    }

    // SOS Modal Close / Finish
    const finishSosBtn = document.getElementById('finish-sos-btn');
    const closeSosBtn = document.getElementById('close-sos-btn');

    if (finishSosBtn) {
      finishSosBtn.addEventListener('click', () => {
        this.handleCravingVictory();
      });
    }

    if (closeSosBtn) {
      closeSosBtn.addEventListener('click', () => {
        this.closeSosModal();
      });
    }

    // Reset / Relapse Modal triggers
    const resetTriggerBtn = document.getElementById('open-reset-modal-btn');
    const closeResetBtn = document.getElementById('close-reset-modal-btn');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    const confirmResetNowBtn = document.getElementById('confirm-reset-now-btn');
    const openDatePickBtn = document.getElementById('open-date-pick-btn');

    if (resetTriggerBtn) {
      resetTriggerBtn.addEventListener('click', () => {
        this.openResetModal();
      });
    }

    if (closeResetBtn) {
      closeResetBtn.addEventListener('click', () => {
        this.closeResetModal();
      });
    }

    if (cancelResetBtn) {
      cancelResetBtn.addEventListener('click', () => {
        this.closeResetModal();
      });
    }

    if (confirmResetNowBtn) {
      confirmResetNowBtn.addEventListener('click', () => {
        this.resetTimerToNow();
      });
    }

    if (openDatePickBtn) {
      openDatePickBtn.addEventListener('click', () => {
        this.closeResetModal();
        this.openDatePickerModal();
      });
    }

    // Date Picker Modal
    const saveQuitDateBtn = document.getElementById('save-quit-date-btn');
    const setNowQuitDateBtn = document.getElementById('set-now-quit-date-btn');
    const closeQuitDateModalBtn = document.getElementById('close-quit-date-modal-btn');

    if (saveQuitDateBtn) {
      saveQuitDateBtn.addEventListener('click', () => {
        this.saveCustomQuitDate();
      });
    }

    if (setNowQuitDateBtn) {
      setNowQuitDateBtn.addEventListener('click', () => {
        this.fillPickerWithNow();
      });
    }

    if (closeQuitDateModalBtn) {
      closeQuitDateModalBtn.addEventListener('click', () => {
        this.closeDatePickerModal();
      });
    }

    // Edit Date Quick Link on Hero
    const editDateLink = document.getElementById('hero-edit-date-btn');
    if (editDateLink) {
      editDateLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDatePickerModal();
      });
    }
  },

  startTimerLoop() {
    if (timerInterval) clearInterval(timerInterval);

    const tick = () => {
      this.updateTimerDisplay();
      this.updateCounters();
      // Check milestones
      BadgesManager.checkAchievements();
    };

    tick();
    timerInterval = setInterval(tick, 1000);
  },

  updateTimerDisplay() {
    const daysEl = document.getElementById('timer-days-val');
    const timeEl = document.getElementById('timer-time-val');
    const subtextEl = document.getElementById('timer-subtext');

    const quitTime = Storage.getQuitTime();
    const diffMs = Math.max(0, Date.now() - quitTime);

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const remSeconds = totalSeconds % 86400;
    const hours = Math.floor(remSeconds / 3600);
    const minutes = Math.floor((remSeconds % 3600) / 60);
    const seconds = remSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');

    if (daysEl) {
      if (days === 0) {
        daysEl.textContent = 'PRVI DAN';
      } else if (days === 1) {
        daysEl.textContent = '1 DAN';
      } else if (days < 5) {
        daysEl.textContent = `${days} DANA`;
      } else {
        daysEl.textContent = `${days} DANA`;
      }
    }

    if (timeEl) {
      timeEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    if (subtextEl) {
      const qDate = new Date(quitTime);
      const dateStr = qDate.toLocaleDateString('sr-RS', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = qDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      subtextEl.textContent = `Slobodan od: ${dateStr} u ${timeStr}`;
    }

    // Next Milestone Progress
    const nextBadge = BadgesManager.getNextMilestone();
    const nextBadgeBox = document.getElementById('next-badge-info');

    if (nextBadge && nextBadgeBox) {
      nextBadgeBox.style.display = 'block';
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
        timeStr += `${remM}m do dostizanja`;
        nextTimeEl.textContent = `${nextBadge.progressPercent}% (${timeStr})`;
      }
    } else if (nextBadgeBox) {
      nextBadgeBox.style.display = 'none';
    }
  },

  updateCounters() {
    const settings = Storage.getSettings();

    // Money Saved
    const savedMoney = Storage.getSavedMoney();
    const savedMoneyEl = document.getElementById('dash-saved-money');
    if (savedMoneyEl) {
      savedMoneyEl.textContent = `${Math.floor(savedMoney).toLocaleString()} ${settings.currency}`;
    }

    // Cigarettes Avoided
    const avoidedCigs = Storage.getCigarettesAvoided();
    const avoidedCigsEl = document.getElementById('dash-avoided-cigs');
    if (avoidedCigsEl) {
      avoidedCigsEl.textContent = `${Math.floor(avoidedCigs).toLocaleString()}`;
    }

    // Life Regained
    const lifeMinutes = Storage.getLifeRegainedMinutes();
    const lifeRegainedEl = document.getElementById('dash-life-regained');
    if (lifeRegainedEl) {
      if (lifeMinutes < 60) {
        lifeRegainedEl.textContent = `${lifeMinutes} min`;
      } else if (lifeMinutes < 1440) {
        const h = Math.floor(lifeMinutes / 60);
        const m = lifeMinutes % 60;
        lifeRegainedEl.textContent = `${h}h ${m}m`;
      } else {
        const d = Math.floor(lifeMinutes / 1440);
        const h = Math.floor((lifeMinutes % 1440) / 60);
        lifeRegainedEl.textContent = `${d}d ${h}h`;
      }
    }

    // Cravings Survived
    const cravingsEl = document.getElementById('dash-cravings-count');
    if (cravingsEl) {
      cravingsEl.textContent = Storage.getCravingsCount();
    }
  },

  updateUI() {
    this.updateTimerDisplay();
    this.updateCounters();
  },

  // ================= SOS BREATHING WORKFLOW =================
  openSosModal() {
    const modal = document.getElementById('sos-modal');
    if (!modal) return;

    modal.classList.add('active');

    const settings = Storage.getSettings();
    if (settings.soundEnabled) Sound.playClick();
    if (settings.hapticEnabled) Sound.triggerHaptic('medium');

    // Show random tip
    const tipEl = document.getElementById('sos-tip-text');
    if (tipEl) {
      const randomTip = CRAVING_TIPS[Math.floor(Math.random() * CRAVING_TIPS.length)];
      tipEl.textContent = `💡 "${randomTip}"`;
    }

    this.startBreathingCycle();
  },

  closeSosModal() {
    const modal = document.getElementById('sos-modal');
    if (modal) modal.classList.remove('active');
    this.stopBreathingCycle();
  },

  startBreathingCycle() {
    this.stopBreathingCycle();

    const circle = document.getElementById('breathing-circle');
    const label = document.getElementById('breathing-phase-label');
    const timer = document.getElementById('breathing-phase-timer');
    const settings = Storage.getSettings();

    let phase = 'inhale'; // 'inhale' (4s) -> 'hold' (7s) -> 'exhale' (8s)
    let secondsLeft = 4;

    const setPhase = (p, duration, text) => {
      phase = p;
      secondsLeft = duration;
      if (label) label.textContent = text;
      if (timer) timer.textContent = `${secondsLeft}s`;

      if (circle) {
        circle.className = `breathing-circle ${phase}`;
      }

      if (settings.soundEnabled) Sound.playBreathChime(phase);
      if (settings.hapticEnabled) Sound.triggerHaptic('breath');
    };

    setPhase('inhale', 4, 'Udahni lagano kroz nos...');

    breathingInterval = setInterval(() => {
      secondsLeft--;
      if (timer) timer.textContent = `${secondsLeft}s`;

      if (secondsLeft <= 0) {
        if (phase === 'inhale') {
          setPhase('hold', 7, 'Zadrži dah mirno...');
        } else if (phase === 'hold') {
          setPhase('exhale', 8, 'Izdahni potpuno kroz usta...');
        } else {
          setPhase('inhale', 4, 'Udahni ponovo...');
        }
      }
    }, 1000);
  },

  stopBreathingCycle() {
    if (breathingInterval) {
      clearInterval(breathingInterval);
      breathingInterval = null;
    }
  },

  handleCravingVictory() {
    this.stopBreathingCycle();
    this.closeSosModal();

    const newCount = Storage.incrementCravings();

    const settings = Storage.getSettings();
    if (settings.soundEnabled) Sound.playAchievementFanfare();
    if (settings.hapticEnabled) Sound.triggerHaptic('achievement');

    fireConfetti(3500);

    // Check badges for cravings
    BadgesManager.checkAchievements();
    this.updateCounters();

    // Trigger toast
    this.showToast(`🎉 Bravo! Pobeđena kriza br. ${newCount}. Tvoja volja pobeđuje!`);
  },

  showToast(msg) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('visible');

    setTimeout(() => {
      toast.classList.remove('visible');
    }, 4500);
  },

  // ================= RESET MODAL WORKFLOW =================
  openResetModal() {
    const modal = document.getElementById('reset-confirm-modal');
    if (modal) modal.classList.add('active');
  },

  closeResetModal() {
    const modal = document.getElementById('reset-confirm-modal');
    if (modal) modal.classList.remove('active');
  },

  resetTimerToNow() {
    Storage.setQuitTime(Date.now());
    const settings = Storage.getSettings();
    if (settings.soundEnabled) Sound.playUndo();
    if (settings.hapticEnabled) Sound.triggerHaptic('undo');

    this.closeResetModal();
    this.updateUI();
    window.dispatchEvent(new CustomEvent('stats_updated'));
    this.showToast('Tajmer je resetovan na ovaj trenutak. Glavu gore, nova pobeda počinje sad!');
  },

  // ================= DATE PICKER WORKFLOW =================
  openDatePickerModal() {
    const modal = document.getElementById('date-picker-modal');
    const input = document.getElementById('quit-datetime-picker');
    if (!modal || !input) return;

    const currentQuit = Storage.getQuitTime();
    input.value = this.toLocalISOString(new Date(currentQuit));

    modal.classList.add('active');
  },

  closeDatePickerModal() {
    const modal = document.getElementById('date-picker-modal');
    if (modal) modal.classList.remove('active');
  },

  fillPickerWithNow() {
    const input = document.getElementById('quit-datetime-picker');
    if (input) {
      input.value = this.toLocalISOString(new Date());
    }
  },

  saveCustomQuitDate() {
    const input = document.getElementById('quit-datetime-picker');
    if (!input || !input.value) return;

    const chosenDate = new Date(input.value);
    if (isNaN(chosenDate.getTime())) return;

    Storage.setQuitTime(chosenDate.getTime());
    this.closeDatePickerModal();
    this.updateUI();
    window.dispatchEvent(new CustomEvent('stats_updated'));
    this.showToast('Datum prestanka uspešno sačuvan!');
  },

  toLocalISOString(date) {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  }
};
