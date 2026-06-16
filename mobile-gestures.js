/**
 * Mobile Gestures
 * Handles native swipe detection for tabs and carousels on mobile devices.
 */

class GestureManager {
  constructor() {
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.touchStartY = 0;
    this.touchEndY = 0;
    
    this.minSwipeDistance = 50; // Minimum px distance to register a swipe
    this.maxVerticalDeviation = 30; // Max px vertical movement to still be considered a horizontal swipe

    this.init();
  }

  init() {
    // Only initialize on mobile screens
    if (window.innerWidth > 768) return;

    // Attach to the main document body, but only intercept if we are interacting with tabbed content
    document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
  }

  handleTouchStart(e) {
    this.touchStartX = e.changedTouches[0].screenX;
    this.touchStartY = e.changedTouches[0].screenY;
  }

  handleTouchEnd(e) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.touchEndY = e.changedTouches[0].screenY;
    this.handleSwipe();
  }

  handleSwipe() {
    const xDistance = this.touchEndX - this.touchStartX;
    const yDistance = Math.abs(this.touchEndY - this.touchStartY);

    // If they scrolled vertically too much, it's not a swipe
    if (yDistance > this.maxVerticalDeviation) return;

    if (xDistance < -this.minSwipeDistance) {
      // Swiped Left
      this.triggerTabChange('next');
    } else if (xDistance > this.minSwipeDistance) {
      // Swiped Right
      this.triggerTabChange('prev');
    }
  }

  triggerTabChange(direction) {
    // Look for active tabs on the page (e.g., League page tabs)
    const tabs = Array.from(document.querySelectorAll('.tab'));
    if (tabs.length === 0) return;

    const activeIndex = tabs.findIndex(tab => tab.classList.contains('active'));
    if (activeIndex === -1) return;

    let targetIndex = activeIndex;

    if (direction === 'next' && activeIndex < tabs.length - 1) {
      targetIndex = activeIndex + 1;
    } else if (direction === 'prev' && activeIndex > 0) {
      targetIndex = activeIndex - 1;
    }

    if (targetIndex !== activeIndex) {
      // Trigger click on the target tab natively
      tabs[targetIndex].click();
      
      // Ensure the tab itself scrolls into view inside the tab container
      tabs[targetIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.gestureManager = new GestureManager();
});
