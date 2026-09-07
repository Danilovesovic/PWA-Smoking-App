/**
 * Health Timeline & Finance / Wishlist Rendering Logic
 */

import { Storage } from './storage.js';
import { BadgesManager, HEALTH_MILESTONES, BADGE_DEFINITIONS } from './badges.js';
import { Sound } from './audio.js';

export const StatsView = {
  renderAll() {
    this.renderHealthTimeline();
    this.renderFinanceAndWishlist();
  },

  renderHealthTimeline() {
    const container = document.getElementById('health-timeline-container');
    const unlockedCounter = document.getElementById('health-milestones-unlocked-count');
    if (!container) return;

    const milestones = BadgesManager.getAllMilestonesWithProgress();
    const unlockedCount = milestones.filter(m => m.isUnlocked).length;
    const totalCount = milestones.length;

    if (unlockedCounter) {
      unlockedCounter.textContent = `${unlockedCount} / ${totalCount} Dostignuto`;
    }

    let html = '';

    milestones.forEach(m => {
      const isCompleted = m.isUnlocked || m.progressPercent >= 100;
      const progress = isCompleted ? 100 : m.progressPercent;

      let remainingStr = '';
      if (!isCompleted) {
        const remH = Math.floor(m.remainingMinutes / 60);
        const remM = m.remainingMinutes % 60;
        if (remH >= 24) {
          const days = Math.floor(remH / 24);
          const h = remH % 24;
          remainingStr = `još ${days}d ${h}h`;
        } else if (remH > 0) {
          remainingStr = `još ${remH}h ${remM}m`;
        } else {
          remainingStr = `još ${remM}m`;
        }
      }

      html += `
        <div class="health-milestone-card ${isCompleted ? 'completed' : 'in-progress'}">
          <div class="milestone-top-row">
            <div class="milestone-icon-title">
              <span class="milestone-icon">${m.icon}</span>
              <div>
                <h4 class="milestone-title">${m.title}</h4>
                <span class="milestone-target">${m.shortDesc}</span>
              </div>
            </div>
            <div class="milestone-status-badge ${isCompleted ? 'badge-done' : 'badge-active'}">
              ${isCompleted ? '✓ Oporavljeno' : `${progress}%`}
            </div>
          </div>

          <p class="milestone-benefit-text">${m.benefit}</p>

          <div class="milestone-progress-wrap">
            <div class="milestone-progress-bar" style="width: ${progress}%;"></div>
          </div>

          ${!isCompleted ? `
            <div class="milestone-remaining-time">
              <span>Napredak: ${progress}%</span>
              <span>${remainingStr}</span>
            </div>
          ` : ''}
        </div>
      `;
    });

    // Also append Cravings Badges section
    const cravingBadges = BADGE_DEFINITIONS.filter(b => b.category === 'craving');
    const unlockedMap = Storage.getUnlockedBadges();
    const cravingsCount = Storage.getCravingsCount();

    html += `
      <div class="cravings-section-header">
        <h3 class="subsection-title">🛡️ Trofeji Snage Volje</h3>
        <span class="subsection-subtitle">${cravingsCount} pobeđenih kriza</span>
      </div>
      <div class="cravings-badges-grid">
    `;

    cravingBadges.forEach(b => {
      const isAchieved = !!unlockedMap[b.id] || cravingsCount >= b.targetCravings;
      html += `
        <div class="craving-badge-card ${isAchieved ? 'unlocked' : 'locked'}">
          <span class="craving-badge-icon">${b.icon}</span>
          <div class="craving-badge-name">${b.title}</div>
          <div class="craving-badge-desc">${b.shortDesc}</div>
          ${isAchieved ? '<span class="craving-check">✓ Osvojeno</span>' : `<span class="craving-lock">🔒 Cilj: ${b.targetCravings}</span>`}
        </div>
      `;
    });

    html += `</div>`;

    container.innerHTML = html;
  },

  renderFinanceAndWishlist() {
    const settings = Storage.getSettings();
    const savedMoney = Storage.getSavedMoney();
    const avoidedCigs = Storage.getCigarettesAvoided();
    const pricePerCig = (settings.packPrice || 450) / (settings.perPack || 20);
    const dailyCost = (settings.dailyCigarettes || 20) * pricePerCig;

    // Highlights
    const totalSavedEl = document.getElementById('finance-total-saved');
    const avoidedCigsEl = document.getElementById('finance-avoided-cigs');
    const daySavedEl = document.getElementById('finance-day-rate');
    const monthSavedEl = document.getElementById('finance-month-rate');
    const yearSavedEl = document.getElementById('finance-year-rate');

    if (totalSavedEl) totalSavedEl.textContent = Storage.formatMoney(savedMoney);
    if (avoidedCigsEl) avoidedCigsEl.textContent = `${Math.floor(avoidedCigs).toLocaleString()}`;
    if (daySavedEl) daySavedEl.textContent = Storage.formatMoney(dailyCost);
    if (monthSavedEl) monthSavedEl.textContent = Storage.formatMoney(dailyCost * 30);
    if (yearSavedEl) yearSavedEl.textContent = Storage.formatMoney(dailyCost * 365);

    // Wishlist List
    const wishlistContainer = document.getElementById('wishlist-items-container');
    if (!wishlistContainer) return;

    const wishlist = Storage.getWishlist();

    if (wishlist.length === 0) {
      wishlistContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎁</div>
          <div class="empty-title">Tvoja lista želja je prazna</div>
          <div class="empty-desc">Dodaj stvari koje želiš sebi da priuštiš od novca ušteđenog od cigareta!</div>
        </div>
      `;
      return;
    }

    let itemsHtml = '';

    wishlist.forEach(item => {
      const isReached = savedMoney >= item.price;
      const progressPercent = Math.min(100, Math.floor((savedMoney / item.price) * 100));
      const remainingMoney = Math.max(0, item.price - savedMoney);
      const daysLeft = dailyCost > 0 ? Math.ceil(remainingMoney / dailyCost) : 0;

      itemsHtml += `
        <div class="wishlist-card ${isReached ? 'achieved' : ''}">
          <div class="wishlist-card-header">
            <div class="wishlist-title-box">
              <span class="wishlist-icon">${item.icon || '🎁'}</span>
              <div>
                <h4 class="wishlist-title">${item.title}</h4>
                <span class="wishlist-price">${Storage.formatMoney(item.price)}</span>
              </div>
            </div>
            <button class="delete-wish-btn" data-id="${item.id}" title="Ukloni sa liste">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="wishlist-progress-track">
            <div class="wishlist-progress-fill" style="width: ${progressPercent}%;"></div>
          </div>

          <div class="wishlist-footer">
            ${isReached ? `
              <span class="wishlist-unlocked-tag">🎉 Možeš kupiti odmah!</span>
              <span class="wishlist-progress-pct">100%</span>
            ` : `
              <span class="wishlist-days-left">Još ${Storage.formatMoney(remainingMoney)} (~${daysLeft} ${daysLeft === 1 ? 'dan' : 'dana'})</span>
              <span class="wishlist-progress-pct">${progressPercent}%</span>
            `}
          </div>
        </div>
      `;
    });

    wishlistContainer.innerHTML = itemsHtml;

    // Bind delete buttons
    wishlistContainer.querySelectorAll('.delete-wish-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          Storage.deleteWishlistItem(id);
          this.renderFinanceAndWishlist();
        }
      });
    });
  },

  setupWishlistForm() {
    const form = document.getElementById('add-wish-form');
    const titleInput = document.getElementById('wish-title-input');
    const priceInput = document.getElementById('wish-price-input');
    const iconInput = document.getElementById('wish-icon-select');

    if (!form || !titleInput || !priceInput) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = titleInput.value.trim();
      const price = parseFloat(priceInput.value);
      const icon = iconInput ? iconInput.value : '🎁';

      if (title && !isNaN(price) && price > 0) {
        Storage.addWishlistItem({ title, price, icon });
        titleInput.value = '';
        priceInput.value = '';
        this.renderFinanceAndWishlist();
        Sound.playClick();
      }
    });
  }
};
