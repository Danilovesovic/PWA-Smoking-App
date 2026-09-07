/**
 * Badges & Health Recovery System (Quit Smoking Edition)
 * Evaluates biological milestones based on WHO recovery timeline, savings, and cravings survived.
 */

import { Storage } from './storage.js';
import { Sound } from './audio.js';
import { fireConfetti } from './confetti.js';

export const HEALTH_MILESTONES = [
  {
    id: 'time_20m',
    title: 'Prvih 20 Minuta',
    targetMinutes: 20,
    icon: '🫀',
    shortDesc: '20 min bez dima',
    benefit: 'Otkucaji srca i krvni pritisak počinju da se vraćaju u normalne vrednosti.'
  },
  {
    id: 'time_1h',
    title: '1 Sat Pobede',
    targetMinutes: 60,
    icon: '⚡',
    shortDesc: '1 sat bez dima',
    benefit: 'Nivo nikotina u krvi počinje osetno da opada. Cirkulacija se ubrzava.'
  },
  {
    id: 'time_2h',
    title: '2 Sata Discipline',
    targetMinutes: 120,
    icon: '🛡️',
    shortDesc: '2 sata bez dima',
    benefit: 'Periferna cirkulacija se popravlja, prsti na rukama i nogama postaju topliji.'
  },
  {
    id: 'time_4h',
    title: '4 Sata Čistoće',
    targetMinutes: 240,
    icon: '💪',
    shortDesc: '4 sata bez dima',
    benefit: 'Srčani ritam je stabilan, a nivo stresa u kardiovaskularnom sistemu opada.'
  },
  {
    id: 'time_8h',
    title: '8 Sati: Kiseonik Raste',
    targetMinutes: 480,
    icon: '🌊',
    shortDesc: '8 sati bez dima',
    benefit: 'Nivo ugljen-monoksida u krvi opada za 50%, a nivo kiseonika u ćelijama dostiže normalu.'
  },
  {
    id: 'time_12h',
    title: '12 Sati: Čista Krv',
    targetMinutes: 720,
    icon: '🩸',
    shortDesc: '12 sati bez dima',
    benefit: 'Ugljen-monoksid u krvi pao je na potpuno normalan nivo. Svi organi napokon slobodno dišu!'
  },
  {
    id: 'time_24h',
    title: '24 Sata: Heroj Dana!',
    targetMinutes: 1440,
    icon: '🏆',
    shortDesc: '1 ceo dan bez dima',
    benefit: 'Rizik od naglog srčanog udara počinje merljivo da opada već nakon prvih 24 časa.'
  },
  {
    id: 'time_48h',
    title: '48 Sati: Povratak Čula',
    targetMinutes: 2880,
    icon: '🍎',
    shortDesc: '2 dana bez dima',
    benefit: 'Nervni završeci počinju da se obnavljaju! Čula ukusa i mirisa postaju znatno izoštrenija.'
  },
  {
    id: 'time_72h',
    title: '72 Sata: 100% Bez Nikotina!',
    targetMinutes: 4320,
    icon: '🌟',
    shortDesc: '3 dana bez dima',
    benefit: 'Sav nikotin je napustio tvoj organizam! Bronhijalne cevi se opuštaju, energija raste.'
  },
  {
    id: 'time_5d',
    title: '5 Dana Slobode',
    targetMinutes: 7200,
    icon: '🚀',
    shortDesc: '5 dana bez dima',
    benefit: 'Disanje je primetno lakše, a jutarnje buđenje prolazi bez težine u grudima.'
  },
  {
    id: 'time_7d',
    title: '7 Dana: Šampion Nedelje!',
    targetMinutes: 10080,
    icon: '👑',
    shortDesc: '1 nedelja bez dima',
    benefit: 'Prebrođena najteža fizička faza odvikavanja! Psihološka zavisnost ubrzano slabi.'
  },
  {
    id: 'time_14d',
    title: '2 Nedelje Čistote',
    targetMinutes: 20160,
    icon: '💎',
    shortDesc: '2 nedelje bez dima',
    benefit: 'Cirkulacija i kapacitet pluća su porasli i do 30%. Hodanje uz stepenice je lakše nego ikad.'
  },
  {
    id: 'time_30d',
    title: '1 Mesec: Nova Osoba!',
    targetMinutes: 43200,
    icon: '🏅',
    shortDesc: '1 mesec bez dima',
    benefit: 'Treplje (cilije) u plućima su obnovljene. Kašalj i zapaljenski procesi se drastično smanjuju.'
  },
  {
    id: 'time_90d',
    title: '3 Meseca: Čelična Pluća',
    targetMinutes: 129600,
    icon: '🫁',
    shortDesc: '3 meseca bez dima',
    benefit: 'Plućna funkcija je drastično unapređena. Krvotok u celom telu funkcioniše besprekorno.'
  },
  {
    id: 'time_180d',
    title: '6 Meseci: Mir i Snaga',
    targetMinutes: 259200,
    icon: '🧘',
    shortDesc: '6 meseci bez dima',
    benefit: 'Nivo stresa i anksioznosti je znatno niži nego u periodu dok si konzumirao cigarete.'
  },
  {
    id: 'time_365d',
    title: '1 Godina: Prepolovljen Rizik!',
    targetMinutes: 525600,
    icon: '❤️',
    shortDesc: '1 cela godina slobode',
    benefit: 'Rizik od koronarne bolesti srca je tačno 50% manji u odnosu na aktivnog pušača!'
  },
  {
    id: 'time_1825d',
    title: '5 Godina: Trijumf!',
    targetMinutes: 2628000,
    icon: '🌟',
    shortDesc: '5 godina bez dima',
    benefit: 'Rizik od moždanog udara je izjednačen sa osobom koja nikada u životu nije pušila.'
  }
];

export const BADGE_DEFINITIONS = [
  ...HEALTH_MILESTONES.map(m => ({
    ...m,
    category: 'health',
    healthBenefit: m.benefit
  })),

  // Cravings badges
  {
    id: 'craving_1',
    title: 'Čelična Volja',
    category: 'craving',
    targetCravings: 1,
    icon: '🛡️',
    shortDesc: 'Prebrođena prva kriza',
    healthBenefit: 'Dokazao si sebi da kriza traje par minuta i da je jača tvoja volja!'
  },
  {
    id: 'craving_5',
    title: 'Gospodar Želje',
    category: 'craving',
    targetCravings: 5,
    icon: '🥊',
    shortDesc: '5 prebrođenih kriza',
    healthBenefit: 'Svaka pobeđena kriza trajno slabi refleks pušenja u mozgu.'
  },
  {
    id: 'craving_10',
    title: 'Nesalomiv',
    category: 'craving',
    targetCravings: 10,
    icon: '🥋',
    shortDesc: '10 pobeđenih kriza',
    healthBenefit: 'Naučio si svoje telo i um da funkcionišu potpuno autonomno i slobodno.'
  }
];

export const BadgesManager = {
  checkAchievements() {
    const durationMs = Storage.getDurationMs();
    const minutesSinceQuit = Math.floor(durationMs / (1000 * 60));
    const cravingsCount = Storage.getCravingsCount();
    const unlocked = Storage.getUnlockedBadges();

    const newlyUnlocked = [];

    // Health / Time milestones
    HEALTH_MILESTONES.forEach(m => {
      if (minutesSinceQuit >= m.targetMinutes && !unlocked[m.id]) {
        if (Storage.saveUnlockedBadge(m.id, { minutesAchieved: minutesSinceQuit })) {
          newlyUnlocked.push({ ...m, healthBenefit: m.benefit });
        }
      }
    });

    // Craving milestones
    BADGE_DEFINITIONS.filter(b => b.category === 'craving').forEach(b => {
      if (cravingsCount >= b.targetCravings && !unlocked[b.id]) {
        if (Storage.saveUnlockedBadge(b.id, { cravingsAchieved: cravingsCount })) {
          newlyUnlocked.push(b);
        }
      }
    });

    if (newlyUnlocked.length > 0) {
      this.celebrateNewBadges(newlyUnlocked);
    }

    return newlyUnlocked;
  },

  getNextMilestone() {
    const durationMs = Storage.getDurationMs();
    const minutesSinceQuit = Math.floor(durationMs / (1000 * 60));

    for (const milestone of HEALTH_MILESTONES) {
      if (minutesSinceQuit < milestone.targetMinutes) {
        const remainingMinutes = milestone.targetMinutes - minutesSinceQuit;
        const progressPercent = Math.min(100, Math.floor((minutesSinceQuit / milestone.targetMinutes) * 100));
        return {
          ...milestone,
          remainingMinutes,
          progressPercent
        };
      }
    }

    return null; // All completed
  },

  getAllMilestonesWithProgress() {
    const durationMs = Storage.getDurationMs();
    const minutesSinceQuit = Math.floor(durationMs / (1000 * 60));
    const unlockedMap = Storage.getUnlockedBadges();

    return HEALTH_MILESTONES.map(m => {
      const isUnlocked = !!unlockedMap[m.id] || minutesSinceQuit >= m.targetMinutes;
      const progressPercent = isUnlocked ? 100 : Math.min(99, Math.max(0, Math.floor((minutesSinceQuit / m.targetMinutes) * 100)));
      const remainingMinutes = Math.max(0, m.targetMinutes - minutesSinceQuit);

      return {
        ...m,
        isUnlocked,
        progressPercent,
        remainingMinutes
      };
    });
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
    if (benefitEl) benefitEl.textContent = badge.healthBenefit || badge.benefit;

    modal.classList.add('active');
  }
};
