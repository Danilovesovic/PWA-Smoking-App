/**
 * Stats, Logs & Badges Room Rendering Logic
 */

import { Storage } from './storage.js';
import { BADGE_DEFINITIONS } from './badges.js';
import { Sound } from './audio.js';

export const StatsView = {
  renderAll() {
    this.renderLogs();
    this.renderBadgesRoom();
    this.renderFinanceStats();
  },

  renderLogs() {
    const container = document.getElementById('logs-list-container');
    if (!container) return;

    const grouped = Storage.getLogsGroupedByDate();
    const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    if (dateKeys.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-title">Još uvek nema unosa</div>
          <div class="empty-desc">Pritisni veliko "SMOKE" dugme na glavnom ekranu ili dodaj unos ručno.</div>
        </div>
      `;
      return;
    }

    const todayKey = Storage.getDateKey(new Date());
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayKey = Storage.getDateKey(yesterdayObj);

    let html = '';

    dateKeys.forEach(dateKey => {
      const logs = grouped[dateKey];
      let dayTitle = dateKey;
      if (dateKey === todayKey) dayTitle = 'Danas';
      else if (dateKey === yesterdayKey) dayTitle = 'Juče';
      else {
        const d = new Date(dateKey + 'T00:00:00');
        dayTitle = d.toLocaleDateString('sr-RS', { weekday: 'short', day: 'numeric', month: 'short' });
      }

      html += `
        <div class="log-group-card">
          <div class="log-group-header">
            <span class="log-group-title">${dayTitle}</span>
            <span class="log-group-badge">${logs.length} ${logs.length === 1 ? 'cigareta' : 'cigareta'}</span>
          </div>
          <div class="log-items-list">
      `;

      logs.forEach(log => {
        html += `
          <div class="log-item" data-id="${log.id}">
            <div class="log-time-col">
              <span class="log-bullet"></span>
              <span class="log-time">${log.timeString || '—'}</span>
            </div>
            ${log.note ? `<div class="log-note">${log.note}</div>` : ''}
            <button class="log-delete-btn" data-id="${log.id}" title="Obriši ovaj unos">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Bind delete buttons
    container.querySelectorAll('.log-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        if (id) {
          Storage.deleteLog(id);
          Sound.playUndo();
          this.renderAll();
          window.dispatchEvent(new CustomEvent('smoke_logged'));
        }
      });
    });
  },

  renderBadgesRoom() {
    const container = document.getElementById('badges-grid-container');
    const badgeStatsHeader = document.getElementById('badges-unlocked-count');
    if (!container) return;

    const unlockedMap = Storage.getUnlockedBadges();
    const unlockedCount = Object.keys(unlockedMap).length;
    const totalCount = BADGE_DEFINITIONS.length;

    if (badgeStatsHeader) {
      badgeStatsHeader.textContent = `${unlockedCount} / ${totalCount} Otključano`;
    }

    let html = '';

    BADGE_DEFINITIONS.forEach(badge => {
      const isUnlocked = !!unlockedMap[badge.id];
      const unlockedInfo = unlockedMap[badge.id];

      let unlockedTimeStr = '';
      if (isUnlocked && unlockedInfo && unlockedInfo.unlockedAt) {
        const d = new Date(unlockedInfo.unlockedAt);
        unlockedTimeStr = `Osvojeno: ${d.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
      }

      html += `
        <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="badge-icon-box">
            <span class="badge-emoji">${badge.icon}</span>
            ${isUnlocked ? '<span class="badge-check-tag">✓</span>' : '<span class="badge-lock-tag">🔒</span>'}
          </div>
          <div class="badge-content">
            <h4 class="badge-name">${badge.title}</h4>
            <div class="badge-target">${badge.shortDesc}</div>
            <p class="badge-benefit">${badge.healthBenefit}</p>
            ${unlockedTimeStr ? `<div class="badge-date">${unlockedTimeStr}</div>` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  renderFinanceStats() {
    const settings = Storage.getSettings();
    const logs = Storage.getLogs();
    const grouped = Storage.getLogsGroupedByDate();
    const pricePerCig = (settings.packPrice || 420) / (settings.perPack || 20);

    const totalCigs = logs.length;
    const totalSpent = (totalCigs * pricePerCig).toFixed(0);

    // Days count
    const daysCount = Math.max(1, Object.keys(grouped).length);
    const dailyAvg = (totalCigs / daysCount).toFixed(1);
    const dailyAvgCost = (dailyAvg * pricePerCig).toFixed(0);

    // This week calculation (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const weekLogs = logs.filter(l => l.timestamp >= sevenDaysAgo.getTime());
    const weekSpent = (weekLogs.length * pricePerCig).toFixed(0);

    // Update DOM elements
    const totalSpentEl = document.getElementById('stat-total-spent');
    const totalCigsEl = document.getElementById('stat-total-cigs');
    const dailyAvgEl = document.getElementById('stat-daily-avg');
    const dailyCostEl = document.getElementById('stat-daily-cost');
    const weekSpentEl = document.getElementById('stat-week-spent');
    const currencyTags = document.querySelectorAll('.currency-tag');

    if (totalSpentEl) totalSpentEl.textContent = `${totalSpent}`;
    if (totalCigsEl) totalCigsEl.textContent = `${totalCigs}`;
    if (dailyAvgEl) dailyAvgEl.textContent = `${dailyAvg} cig/dan`;
    if (dailyCostEl) dailyCostEl.textContent = `${dailyAvgCost} ${settings.currency}/dan`;
    if (weekSpentEl) weekSpentEl.textContent = `${weekSpent}`;

    currencyTags.forEach(el => {
      el.textContent = settings.currency;
    });
  }
};
