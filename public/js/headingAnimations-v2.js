/**
 * Tyeb Mehta Foundation - Blur Focus Heading Animations
 * Words transition from blurred to focused, one at a time
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    // Global randomization setting
    randomizeOrder: true, // Set to false for sequential left-to-right
    
    observerOptions: {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    },
    
    variants: {
      blurFocus: {
        filter: 'blur(20px)',
        opacity: 0,
        duration: 1,
        ease: 'power2.out',
        stagger: 0.1
      },
      
      blurFocusFast: {
        filter: 'blur(15px)',
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.08
      },
      
      blurScale: {
        filter: 'blur(25px)',
        opacity: 0,
        scale: 0.95,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.12
      },
      
      blurSlide: {
        filter: 'blur(18px)',
        opacity: 0,
        x: -20,
        duration: 1.1,
        ease: 'power2.out',
        stagger: 0.1
      },
      
      blurFade: {
        filter: 'blur(10px)',
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
        stagger: 0.08
      }
    }
  };

  /**
   * Split text into words without adding margins
   */
  function splitIntoWords(element) {
    const originalText = element.textContent;
    const words = originalText.trim().split(/\s+/);
    
    // Clear element
    element.innerHTML = '';
    element.setAttribute('data-original-text', originalText);
    
    // Create word spans with natural spacing
    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.style.display = 'inline-block';
      span.textContent = word;
      element.appendChild(span);
      
      // Add space as text node (not margin)
      if (index < words.length - 1) {
        element.appendChild(document.createTextNode(' '));
      }
    });
    
    return element.querySelectorAll('.word');
  }

  /**
   * Get animation config for element
   */
  function getAnimation(element) {
    // Check for data attribute override first
    if (element.dataset.animateHeading) {
      return CONFIG.variants[element.dataset.animateHeading] || CONFIG.variants.blurFocus;
    }
    
    // Hero paragraphs - use subtle, fast animation
    if (element.matches('section[data-layout="heroHomepage"] .page-hero-text p')) {
      return CONFIG.variants.blurFocusFast;
    }
    
    // Headings
    if (element.tagName === 'H1') return CONFIG.variants.blurScale;
    if (element.tagName === 'H2') return CONFIG.variants.blurFocus;
    if (element.classList.contains('subtitle')) return CONFIG.variants.blurFocusFast;
    if (element.classList.contains('page-title')) return CONFIG.variants.blurSlide;
    
    // Default
    return CONFIG.variants.blurFocusFast;
  }

  /**
   * Animate element (heading or paragraph)
   */
  function animate(element) {
    const animation = getAnimation(element);
    
    // console.log('[BLUR ANIMATE] Starting:', element.textContent.substring(0, 40));
    // console.log('[BLUR ANIMATE] Element type:', element.tagName, element.className);
    
    // Split into words
    const words = splitIntoWords(element);
    // console.log('[BLUR ANIMATE] Words:', words.length);
    
    // Make element visible (container should always be visible)
    element.style.visibility = 'visible';
    element.style.opacity = '1';
    
    // Set initial state for words
    gsap.set(words, {
      filter: animation.filter,
      opacity: 0,
      scale: animation.scale || 1,
      x: animation.x || 0,
      y: animation.y || 0,
      force3D: true
    });
    
    // Determine stagger configuration
    let staggerConfig;
    
    if (CONFIG.randomizeOrder) {
      // Random order with shuffle
      // console.log('[BLUR ANIMATE] Using randomized order');
      staggerConfig = {
        amount: animation.stagger * words.length,
        from: 'random', // GSAP's built-in random
        ease: 'none'
      };
    } else {
      // Sequential left-to-right
      // console.log('[BLUR ANIMATE] Using sequential order');
      staggerConfig = animation.stagger;
    }
    
    // console.log('[BLUR ANIMATE] Initial state set, starting tween');
    
    // Animate words
    const tl = gsap.to(words, {
      filter: 'blur(0px)',
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      duration: animation.duration,
      ease: animation.ease,
      stagger: staggerConfig,
      force3D: true,
      // onStart: () => {
      //   console.log('[BLUR ANIMATE] Timeline started');
      // },
      onComplete: () => {
        // console.log('[BLUR ANIMATE] Complete');
        element.classList.add('animated');
        // Clean up inline styles
        gsap.set(words, { clearProps: 'all' });
      }
    });
    
    return tl;
  }

  /**
   * Intersection observer callback
   */
  function onIntersect(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
        // console.log('[BLUR ANIMATE] Element intersecting:', entry.target.textContent.substring(0, 30));
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }

  /**
   * Initialize
   */
  function init() {
    // Check GSAP
    if (typeof gsap === 'undefined') {
      // console.error('[BLUR ANIMATE] GSAP not loaded!');
      return;
    }
    
    // console.log('[BLUR ANIMATE] Initializing with GSAP', gsap.version);
    
    // Find headings and hero paragraphs
    const headings = document.querySelectorAll('h1, h2, h3, h4, .subtitle, .page-title');
    const heroParagraphs = document.querySelectorAll('section[data-layout="heroHomepage"] .page-hero-text p');
    
    // Combine both into single array
    const allElements = [...headings, ...heroParagraphs];
    
    if (allElements.length === 0) {
      // console.warn('[BLUR ANIMATE] No elements found');
      return;
    }
    
    console.log('Found', headings.length, 'headings and', heroParagraphs.length, 'hero paragraphs');
    
    // Create observer
    const observer = new IntersectionObserver(onIntersect, CONFIG.observerOptions);
    
    // Observe each element
    let count = 0;
    allElements.forEach(element => {
      if (element.dataset.noAnimate !== undefined) {
        // console.log('[BLUR ANIMATE] Skipping (data-no-animate):', element.textContent.substring(0, 30));
        return;
      }
      
      element.classList.add('heading-animate');
      observer.observe(element);
      count++;
    });
    
    // console.log('[BLUR ANIMATE] Observing', count, 'elements total');
  }

  /**
   * Wait for GSAP and init
   */
  function checkAndInit() {
    if (typeof gsap !== 'undefined') {
      init();
    } else {
      // console.log('[BLUR ANIMATE] Waiting for GSAP...');
      setTimeout(checkAndInit, 50);
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInit);
  } else {
    checkAndInit();
  }

  // Public API
  window.BlurAnimations = {
    init: init,
    animate: animate,
    config: CONFIG, // Expose config for runtime changes
    setRandomize: (value) => {
      CONFIG.randomizeOrder = value;
      // console.log('[BLUR ANIMATE] Randomize set to:', value);
    }
  };

})();
