/**
 * Badges & Achievements System
 * Evaluates milestones, triggers notifications, sounds, and confetti.
 */

import { Storage } from './storage.js';
import { Sound } from './audio.js';
import { fireConfetti } from './confetti.js';

export const BADGE_DEFINITIONS = [
  // --- Time-based Milestones (Hours/Days without smoke) ---
  {
    id: 'time_20m',
    title: 'Prvih 20 Minuta',
    category: 'time',
    targetMinutes: 20,
    icon: '🫀',
    shortDesc: '20 min bez dima',
    healthBenefit: 'Otkucaji srca i krvni pritisak počinju da se vraćaju u normalne vrednosti.',
    rewardPoints: 50
  },
  {
    id: 'time_1h',
    title: '1 Sat Pobede',
    category: 'time',
    targetMinutes: 60,
    icon: '⚡',
    shortDesc: '1 sat bez dima',
    healthBenefit: 'Nivo nikotina u krvi počinje osetno da opada. Cirkulacija se ubrzava.',
    rewardPoints: 100
  },
  {
    id: 'time_2h',
    title: '2 Sata Discipline',
    category: 'time',
    targetMinutes: 120,
    icon: '🛡️',
    shortDesc: '2 sata bez dima',
    healthBenefit: 'Telo počinje da se adaptira, prsti i stopala postaju topliji.',
    rewardPoints: 150
  },
  {
    id: 'time_4h',
    title: '4 Sata Snage',
    category: 'time',
    targetMinutes: 240,
    icon: '💪',
    shortDesc: '4 sata bez dima',
    healthBenefit: 'Cirkulacija u celom telu se značajno popravlja.',
    rewardPoints: 200
  },
  {
    id: 'time_6h',
    title: '6 Sati: Čistija Pluća',
    category: 'time',
    targetMinutes: 360,
    icon: '🫁',
    shortDesc: '6 sati bez dima',
    healthBenefit: 'Srčani ritam je stabilan, a pluća počinju proces izbacivanja sluzi.',
    rewardPoints: 300
  },
  {
    id: 'time_8h',
    title: '8 Sati: Kiseonik Raste',
    category: 'time',
    targetMinutes: 480,
    icon: '🌊',
    shortDesc: '8 sati bez dima',
    healthBenefit: 'Nivo ugljen-monoksida u krvi opada za 50%, a nivo kiseonika dostiže normalu.',
    rewardPoints: 400
  },
  {
    id: 'time_12h',
    title: '12 Sati: Čista Krv',
    category: 'time',
    targetMinutes: 720,
    icon: '🩸',
    shortDesc: '12 sati bez dima',
    healthBenefit: 'Ugljen-monoksid u krvi je pao na potpuno normalan nivo. Organi dišu!',
    rewardPoints: 500
  },
  {
    id: 'time_24h',
    title: '24 Sata: Heroj Dana!',
    category: 'time',
    targetMinutes: 1440,
    icon: '🏆',
    shortDesc: '1 ceo dan bez dima',
    healthBenefit: 'Rizik od srčanog udara počinje naglo da opada već nakon prvog dana.',
    rewardPoints: 1000
  },
  {
    id: 'time_36h',
    title: '36 Sati Čelika',
    category: 'time',
    targetMinutes: 2160,
    icon: '🔥',
    shortDesc: '36 sati bez dima',
    healthBenefit: 'Telo je uspešno eliminisalo većinu direktnih otrova iz krvotoka.',
    rewardPoints: 1200
  },
  {
    id: 'time_48h',
    title: '48 Sati: Povratak Čula',
    category: 'time',
    targetMinutes: 2880,
    icon: '🍎',
    shortDesc: '2 dana bez dima',
    healthBenefit: 'Nervni završeci se obnavljaju! Čula ukusa i mirisa postaju znatno izoštrenija.',
    rewardPoints: 1500
  },
  {
    id: 'time_72h',
    title: '72 Sata: Nikotin Nestao!',
    category: 'time',
    targetMinutes: 4320,
    icon: '🌟',
    shortDesc: '3 dana bez dima',
    healthBenefit: '100% nikotina je napustilo tvoj organizam! Disanje je primetno lakše.',
    rewardPoints: 2000
  },
  {
    id: 'time_5d',
    title: '5 Dana Slobode',
    category: 'time',
    targetMinutes: 7200,
    icon: '🚀',
    shortDesc: '5 dana bez dima',
    healthBenefit: 'Bronhijalne cevi u plućima se opuštaju, a nivo opšte fizičke energije raste.',
    rewardPoints: 2500
  },
  {
    id: 'time_7d',
    title: '7 Dana: Šampion Nedelje!',
    category: 'time',
    targetMinutes: 10080,
    icon: '👑',
    shortDesc: '1 nedelja bez dima',
    healthBenefit: 'Prebrođena najteža fizička faza. Psihološka zavisnost ubrzano slabi.',
    rewardPoints: 3500
  },
  {
    id: 'time_14d',
    title: '2 Nedelje Čistote',
    category: 'time',
    targetMinutes: 20160,
    icon: '💎',
    shortDesc: '2 nedelje bez dima',
    healthBenefit: 'Kapacitet pluća je porastao i do 30%. Hodanje i trčanje su znatno lakši.',
    rewardPoints: 5000
  },
  {
    id: 'time_30d',
    title: '1 Mesec: Nova Osoba!',
    category: 'time',
    targetMinutes: 43200,
    icon: '🏅',
    shortDesc: '1 mesec bez dima',
    healthBenefit: 'Cilije u plućima su potpuno obnovljene. Rizik od infekcija je višestruko manji!',
    rewardPoints: 10000
  },

  // --- Habit and Control Badges ---
  {
    id: 'first_log',
    title: 'Preuzeta Kontrola',
    category: 'habit',
    icon: '🎯',
    shortDesc: 'Zabeležena prva cigareta',
    healthBenefit: 'Prvi i najvažniji korak je svesnost o navici i njeno beleženje.',
    rewardPoints: 50
  },
  {
    id: 'under_5_today',
    title: 'Minimalac (< 5 danas)',
    category: 'habit',
    icon: '✨',
    shortDesc: 'Manje od 5 cigareta za ceo dan',
    healthBenefit: 'Odlična kontrola i drastično manji unos katrana.',
    rewardPoints: 300
  },
  {
    id: 'reduction_day',
    title: 'Trend Pada',
    category: 'habit',
    icon: '📉',
    shortDesc: 'Manje cigareta nego juče',
    healthBenefit: 'Svaki dan sa manje cigareta pruža telu priliku za brži oporavak.',
    rewardPoints: 200
  }
];

export const BadgesManager = {
  // Check and evaluate all badges based on current state
  checkAchievements() {
    const lastSmoke = Storage.getLastSmokeTime();
    const logs = Storage.getLogs();
    const settings = Storage.getSettings();
    const unlocked = Storage.getUnlockedBadges();

    const newlyUnlocked = [];

    // 1. Habit: First log
    if (logs.length > 0 && !unlocked['first_log']) {
      if (Storage.saveUnlockedBadge('first_log')) {
        newlyUnlocked.push(this.getBadgeById('first_log'));
      }
    }

    // 2. Time-based badges
    if (lastSmoke) {
      const minutesSinceLast = Math.floor((Date.now() - lastSmoke) / (1000 * 60));

      BADGE_DEFINITIONS.filter(b => b.category === 'time').forEach(badge => {
        if (minutesSinceLast >= badge.targetMinutes && !unlocked[badge.id]) {
          if (Storage.saveUnlockedBadge(badge.id, { minutesAchieved: minutesSinceLast })) {
            newlyUnlocked.push(badge);
          }
        }
      });
    }

    // Trigger celebration for each newly unlocked badge
    if (newlyUnlocked.length > 0) {
      this.celebrateNewBadges(newlyUnlocked);
    }

    return newlyUnlocked;
  },

  getBadgeById(id) {
    return BADGE_DEFINITIONS.find(b => b.id === id);
  },

  getNextMilestone() {
    const lastSmoke = Storage.getLastSmokeTime();
    if (!lastSmoke) {
      return BADGE_DEFINITIONS.find(b => b.id === 'time_20m');
    }

    const minutesSinceLast = Math.floor((Date.now() - lastSmoke) / (1000 * 60));
    const timeBadges = BADGE_DEFINITIONS.filter(b => b.category === 'time');

    for (const badge of timeBadges) {
      if (minutesSinceLast < badge.targetMinutes) {
        const remainingMinutes = badge.targetMinutes - minutesSinceLast;
        const progressPercent = Math.min(100, Math.floor((minutesSinceLast / badge.targetMinutes) * 100));
        return {
          ...badge,
          remainingMinutes,
          progressPercent
        };
      }
    }

    return null; // All completed!
  },

  celebrateNewBadges(badges) {
    const settings = Storage.getSettings();
    if (settings.soundEnabled) {
      Sound.playAchievementFanfare();
    }
    if (settings.hapticEnabled) {
      Sound.triggerHaptic('achievement');
    }
    fireConfetti(3500);

    // Show celebratory modal for the first one, or queue them
    badges.forEach((badge, idx) => {
      setTimeout(() => {
        this.showAchievementModal(badge);
      }, idx * 1200);
    });
  },

  showAchievementModal(badge) {
    const modal = document.getElementById('achievement-modal');
    if (!modal) return;

    const iconEl = document.getElementById('ach-modal-icon');
    const titleEl = document.getElementById('ach-modal-title');
    const descEl = document.getElementById('ach-modal-desc');
    const benefitEl = document.getElementById('ach-modal-benefit');

    if (iconEl) iconEl.textContent = badge.icon;
    if (titleEl) titleEl.textContent = badge.title;
    if (descEl) descEl.textContent = badge.shortDesc;
    if (benefitEl) benefitEl.textContent = badge.healthBenefit;

    modal.classList.add('active');
  }
};
