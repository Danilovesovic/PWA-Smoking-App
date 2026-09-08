/**
 * Storage Manager for Quit Smoking Tracker
 * Handles local persistence of quit date, savings settings, wishlist, and cravings.
 */

const STORAGE_KEYS = {
  SETTINGS: 'st_settings',
  QUIT_TIME: 'st_quit_time',
  BADGES: 'st_unlocked_badges',
  WISHLIST: 'st_wishlist',
  CRAVINGS: 'st_cravings_survived'
};

const DEFAULT_SETTINGS = {
  packPrice: 450,       // Default pack price
  currency: 'RSD',      // 'RSD', 'EUR', 'USD', 'BAM'
  perPack: 20,          // Cigarettes in pack
  dailyCigarettes: 20,  // Average smoked per day before quitting
  soundEnabled: true,   // Sound effects
  hapticEnabled: true   // Vibration
};

const DEFAULT_WISHLIST = [
  { id: 'w_1', title: 'Opuštajuća večera', price: 3500, icon: '🍽️' },
  { id: 'w_2', title: 'Nove patike za trčanje', price: 12000, icon: '👟' },
  { id: 'w_3', title: 'Vikend putovanje', price: 30000, icon: '✈️' }
];

export const Storage = {
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.error('Error loading settings', e);
      return { ...DEFAULT_SETTINGS };
    }
  },

  saveSettings(settings) {
    const current = this.getSettings();
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
  },

  getQuitTime() {
    const stored = localStorage.getItem(STORAGE_KEYS.QUIT_TIME);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    // Fallback: check legacy 'st_last_smoke_time'
    const legacy = localStorage.getItem('st_last_smoke_time');
    if (legacy) {
      const legacyParsed = parseInt(legacy, 10);
      if (!isNaN(legacyParsed) && legacyParsed > 0) {
        this.setQuitTime(legacyParsed);
        return legacyParsed;
      }
    }

    // Default to current time if first time opening
    const now = Date.now();
    this.setQuitTime(now);
    return now;
  },

  setQuitTime(timestamp) {
    localStorage.setItem(STORAGE_KEYS.QUIT_TIME, timestamp.toString());
    localStorage.setItem('st_last_smoke_time', timestamp.toString());
  },

  getDurationMs() {
    const quit = this.getQuitTime();
    return Math.max(0, Date.now() - quit);
  },

  // Calculate cigarettes avoided based on duration and previous daily average
  getCigarettesAvoided() {
    const ms = this.getDurationMs();
    const days = ms / (1000 * 60 * 60 * 24);
    const settings = this.getSettings();
    const daily = settings.dailyCigarettes || 20;
    return days * daily;
  },

  // Calculate money saved based on cigarettes avoided and pack price
  getSavedMoney() {
    const avoided = this.getCigarettesAvoided();
    const settings = this.getSettings();
    const packPrice = parseFloat(settings.packPrice) || 450;
    const perPack = parseInt(settings.perPack, 10) || 20;
    const pricePerCig = packPrice / perPack;
    return avoided * pricePerCig;
  },

  // Format money smartly based on currency and decimal values
  formatMoney(amount, currencyOverride = null) {
    const settings = this.getSettings();
    const currency = currencyOverride || settings.currency || 'RSD';
    const num = Number(amount) || 0;
    const isDecimal = ['BAM', 'EUR', 'USD', 'CHF', 'GBP', 'KM'].includes(currency.toUpperCase()) ||
                      (num % 1 !== 0);

    if (isDecimal) {
      return `${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
    }
    return `${Math.floor(num).toLocaleString()} ${currency}`;
  },

  // Calculate life regained in minutes (~11 minutes saved per avoided cigarette)
  getLifeRegainedMinutes() {
    const avoided = this.getCigarettesAvoided();
    return Math.round(avoided * 11);
  },

  // Cravings Survived
  getCravingsCount() {
    const val = localStorage.getItem(STORAGE_KEYS.CRAVINGS);
    return val ? parseInt(val, 10) : 0;
  },

  incrementCravings() {
    const current = this.getCravingsCount();
    const updated = current + 1;
    localStorage.setItem(STORAGE_KEYS.CRAVINGS, updated.toString());
    return updated;
  },

  // Badges & Milestones
  getUnlockedBadges() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BADGES);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  saveUnlockedBadge(badgeId, badgeData = {}) {
    const badges = this.getUnlockedBadges();
    if (!badges[badgeId]) {
      badges[badgeId] = {
        unlockedAt: Date.now(),
        ...badgeData
      };
      localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
      return true;
    }
    return false;
  },

  // Wishlist
  getWishlist() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WISHLIST);
      return data ? JSON.parse(data) : DEFAULT_WISHLIST;
    } catch (e) {
      return DEFAULT_WISHLIST;
    }
  },

  saveWishlist(list) {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(list));
  },

  addWishlistItem(item) {
    const list = this.getWishlist();
    const newItem = {
      id: 'w_' + Date.now(),
      title: item.title,
      price: parseFloat(item.price) || 1000,
      icon: item.icon || '🎁'
    };
    list.push(newItem);
    this.saveWishlist(list);
    return newItem;
  },

  deleteWishlistItem(id) {
    let list = this.getWishlist();
    list = list.filter(item => item.id !== id);
    this.saveWishlist(list);
    return list;
  },

  resetRelapse() {
    localStorage.removeItem(STORAGE_KEYS.BADGES);
    localStorage.removeItem(STORAGE_KEYS.CRAVINGS);
    localStorage.removeItem('st_smoke_logs');
    this.setQuitTime(Date.now());
  },

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.BADGES);
    localStorage.removeItem(STORAGE_KEYS.CRAVINGS);
    localStorage.removeItem('st_smoke_logs');
    // Set quit time to now
    this.setQuitTime(Date.now());
  }
};
