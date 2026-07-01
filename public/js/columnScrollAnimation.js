/**
 * Scroll-Linked Three Column Animation - All Slide Up
 * All columns slide up from bottom in a staggered sequence
 * Animation synced to scroll position, reverses on scroll up
 */

(function() {
  'use strict';

  const PRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Configuration
  const CONFIG = {
    slideDistance: 256,        // Distance to slide up from (pixels)
    stagger: 0.2,             // Delay between columns (seconds)
    ease: 'none',              // Easing: 'none' for linear scrub
    scrubMode: 'smooth',       // 'instant', 'smooth', or 'very-smooth'
    scrubValues: {
      instant: 0.1,
      smooth: 1,
      'very-smooth': 2
    },
    startTrigger: 'top 85%',   // When animation starts
    endTrigger: 'top 30%',     // When animation completes
    anticipatePin: 0
  };

  function initScrollLinkedAnimations() {
    // Check for GSAP
    if (typeof gsap === 'undefined') {
      console.warn('GSAP not loaded');
      fallbackToExistingAnimation();
      return;
    }

    if (typeof ScrollTrigger === 'undefined') {
      console.warn('ScrollTrigger not loaded');
      fallbackToExistingAnimation();
      return;
    }

    // Register plugin
    gsap.registerPlugin(ScrollTrigger);

    // Get scrub value based on mode
    const scrubValue = CONFIG.scrubValues[CONFIG.scrubMode] || CONFIG.scrubValues.smooth;

    // Target three-column sections
    const threeColumnSections = document.querySelectorAll('section[data-layout="grid"]');

    if (threeColumnSections.length === 0) return;

    threeColumnSections.forEach((section, sectionIndex) => {
      const columns = section.querySelectorAll('.text-wrapper');

      if (columns.length === 0) return;

      // Remove data-animate to prevent conflicts
      section.removeAttribute('data-animate');
      columns.forEach(col => col.removeAttribute('data-animate'));

      // Reduced motion: show columns in place, skip the scroll-linked slide-up.
      if (PRM) {
        gsap.set(columns, { opacity: 1, y: 0 });
        return;
      }

      // Create scroll-linked timeline
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: CONFIG.startTrigger,
          end: CONFIG.endTrigger,
          scrub: scrubValue,
          markers: false,
          id: `cols_3_scroll_${sectionIndex}`,
          anticipatePin: CONFIG.anticipatePin
        }
      });

      // Animate each column - ALL slide UP from bottom
      columns.forEach((column, index) => {
        timeline.fromTo(
          column,
          // From state - all columns start below
          {
            opacity: 0,
            y: CONFIG.slideDistance  // Positive = below starting position
          },
          // To state - slide up to normal position
          {
            opacity: 1,
            y: 0,
            ease: CONFIG.ease,
            duration: 1
          },
          index * CONFIG.stagger  // Stagger: first → second → third
        );
      });
    });

    // Refresh on load and resize
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 250);
    });

  }

  /**
   * Fallback to existing animation system
   */
  function fallbackToExistingAnimation() {
    const threeColumnSections = document.querySelectorAll('section[data-layout="grid"]');
    threeColumnSections.forEach(section => {
      if (!section.hasAttribute('data-animate')) {
        section.setAttribute('data-animate', '');
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollLinkedAnimations);
  } else {
    initScrollLinkedAnimations();
  }

})();
