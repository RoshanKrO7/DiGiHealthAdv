// src/utils/menuHandlers.js
export function setupMenuListeners() {
    const menuItems = document.querySelectorAll('.menu-item');
    const overlay = document.querySelector('.overlay');
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const subMenu = item.querySelector('.sub-menu');
        if (subMenu) {
          subMenu.classList.toggle('active');
          item.classList.toggle('active');
          if (overlay) overlay.classList.toggle('active');
          document.body.style.overflow = subMenu.classList.contains('active') ? 'hidden' : '';
        }
      });
    });
    if (overlay) {
      overlay.addEventListener('click', closeAllMenus);
    }
  }
  
  function closeAllMenus() {
    const menuItems = document.querySelectorAll('.menu-item');
    const overlay = document.querySelector('.overlay');
    menuItems.forEach(item => {
      item.classList.remove('active');
      const subMenu = item.querySelector('.sub-menu');
      if (subMenu) subMenu.classList.remove('active');
    });
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
  