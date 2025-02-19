// src/utils/menuHandlers.js
export function setupMenuListeners() {
    const menuItems = document.querySelectorAll('.menu-item');
    const overlay = document.querySelector('.overlay');
    menuItems.forEach(item => {
      const handler = item.dataset.handler;
      if (handler) {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          if (typeof window[handler] === 'function') {
            window[handler]();
          }
          closeAllMenus();
        });
      }
    });
    if (overlay) {
      overlay.addEventListener('click', closeAllMenus);
    }
  }
  
  function closeAllMenus() {
    const menuItems = document.querySelectorAll('.menu-item');
    const overlay = document.querySelector('.overlay');
    menuItems.forEach(item => item.classList.remove('active'));
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  // Additional event listeners (as in your original file) can be added here.
  document.addEventListener('DOMContentLoaded', () => {
    const healthOverview = document.getElementById('health-overview');
    if (healthOverview) {
      healthOverview.addEventListener('click', () => {
        window.location.href = 'view-reports.html';
      });
    }
    // Repeat for other specific menu items...
  });
  