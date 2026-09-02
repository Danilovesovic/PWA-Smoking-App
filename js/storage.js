/**
 * Storage Manager for Smoke Tracker
 * Handles local persistence of logs, settings, and badge progress.
 */

const STORAGE_KEYS = {
  LOGS: 'st_smoke_logs',
  SETTINGS: 'st_settings',
  BADGES: 'st_unlocked_badges',
  LAST_SMOKE: 'st_last_smoke_time'
};

const DEFAULT_SETTINGS = {
  packPrice: 420,       // Default price in RSD / EUR
  currency: 'RSD',      // 'RSD', 'EUR', 'USD', 'BAM'
  perPack: 20,          // Cigarettes per pack
  soundEnabled: true,   // Sound effects
  hapticEnabled: true,  // Vibration
  dailyTarget: 0        // Optional daily limit / goal
};

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
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading logs', e);
      return [];
    }
  },

  saveLogs(logs) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  addLog(customTimestamp = null, note = '') {
    const logs = this.getLogs();
    const now = customTimestamp ? new Date(customTimestamp) : new Date();
    
    const newEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: now.getTime(),
      dateKey: this.getDateKey(now), // Format: YYYY-MM-DD
      timeString: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      note: note
    };

    logs.unshift(newEntry);
    this.saveLogs(logs);
    
    // Update last smoke timestamp
    this.setLastSmokeTime(now.getTime());

    return newEntry;
  },

  deleteLog(id) {
    let logs = this.getLogs();
    logs = logs.filter(item => item.id !== id);
    this.saveLogs(logs);
    
    // Recalculate last smoke time
    if (logs.length > 0) {
      const maxTime = Math.max(...logs.map(l => l.timestamp));
      this.setLastSmokeTime(maxTime);
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_SMOKE);
    }
    return logs;
  },

  undoLastLog() {
    const logs = this.getLogs();
    if (logs.length === 0) return null;
    
    const removed = logs.shift();
    this.saveLogs(logs);
    
    if (logs.length > 0) {
      this.setLastSmokeTime(logs[0].timestamp);
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_SMOKE);
    }
    return removed;
  },

  getLastSmokeTime() {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_SMOKE);
    if (stored) return parseInt(stored, 10);

    const logs = this.getLogs();
    if (logs.length > 0) {
      return logs[0].timestamp;
    }
    return null;
  },

  setLastSmokeTime(timestamp) {
    localStorage.setItem(STORAGE_KEYS.LAST_SMOKE, timestamp.toString());
  },

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
      return true; // Newly unlocked
    }
    return false; // Already unlocked
  },

  getDateKey(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  getTodayLogs() {
    const todayKey = this.getDateKey(new Date());
    const logs = this.getLogs();
    return logs.filter(l => l.dateKey === todayKey);
  },

  getLogsGroupedByDate() {
    const logs = this.getLogs();
    const grouped = {};
    
    logs.forEach(log => {
      if (!grouped[log.dateKey]) {
        grouped[log.dateKey] = [];
      }
      grouped[log.dateKey].push(log);
    });

    return grouped;
  },

  exportData() {
    return JSON.stringify({
      version: 1,
      exportDate: new Date().toISOString(),
      logs: this.getLogs(),
      settings: this.getSettings(),
      unlockedBadges: this.getUnlockedBadges(),
      lastSmoke: this.getLastSmokeTime()
    }, null, 2);
  },

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.logs && Array.isArray(data.logs)) {
        this.saveLogs(data.logs);
      }
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      if (data.unlockedBadges) {
        localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(data.unlockedBadges));
      }
      if (data.lastSmoke) {
        this.setLastSmokeTime(data.lastSmoke);
      }
      return true;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.BADGES);
    localStorage.removeItem(STORAGE_KEYS.LAST_SMOKE);
  }
};
