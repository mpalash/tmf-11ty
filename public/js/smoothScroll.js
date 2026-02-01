/**
 * smoothScroll.js
 * Lenis + GSAP ScrollTrigger Integration
 * 
 * IMPORTANT: This file requires the following scripts to be loaded BEFORE it:
 * 1. Lenis: https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.29/dist/lenis.min.js
 * 2. GSAP: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
 * 3. ScrollTrigger: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js
 */

(function() {
  'use strict';
  
  // Check if required libraries are loaded
  if (typeof Lenis === 'undefined') {
    console.error('❌ Lenis is not loaded! Add this script before smoothScroll.js:');
    console.error('<script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.29/dist/lenis.min.js"></script>');
    return;
  }
  
  if (typeof gsap === 'undefined') {
    console.error('❌ GSAP is not loaded! Add this script before smoothScroll.js:');
    console.error('<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>');
    return;
  }
  
  if (typeof ScrollTrigger === 'undefined') {
    console.error('❌ ScrollTrigger is not loaded! Add this script before smoothScroll.js:');
    console.error('<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>');
    return;
  }

  // Initialize Lenis
  const lenis = new Lenis({
    duration: 1.2,        // Scroll duration (lower = snappier)
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: false,   // Keep native scroll on mobile
    touchMultiplier: 2,
    infinite: false,
  });

  // Sync Lenis with GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  // Add Lenis to GSAP's ticker
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  // Disable lag smoothing
  gsap.ticker.lagSmoothing(0);

  // Expose Lenis globally
  window.lenis = lenis;

  // Smooth scroll to anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        lenis.scrollTo(targetElement, {
          offset: 0,
          duration: 1.5,
        });
      }
    });
  });

  console.log('Smooth scrolling initialized');
})();
