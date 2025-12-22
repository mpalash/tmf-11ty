/**
 * Tyeb Mehta Foundation - Blur Focus Heading Animations
 * Words transition from blurred to focused, one at a time
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    observerOptions: {
      root: null,
      rootMargin: '0px 0px 0px 0px',
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
   * Get animation config for heading
   */
  function getAnimation(heading) {
    if (heading.dataset.animateHeading) {
      return CONFIG.variants[heading.dataset.animateHeading] || CONFIG.variants.blurFocus;
    }
    
    if (heading.tagName === 'H1') return CONFIG.variants.blurScale;
    if (heading.tagName === 'H2') return CONFIG.variants.blurFocus;
    if (heading.classList.contains('subtitle')) return CONFIG.variants.blurFocusFast;
    
    return CONFIG.variants.blurFocusFast;
  }

  /**
   * Animate heading
   */
  function animate(heading) {
    const animation = getAnimation(heading);
    
    // console.log('[BLUR ANIMATE] Starting:', heading.textContent.substring(0, 40));
    
    // Split into words
    const words = splitIntoWords(heading);
    // console.log('[BLUR ANIMATE] Words:', words.length);
    
    // Make heading visible (container should always be visible)
    heading.style.visibility = 'visible';
    heading.style.opacity = '1';
    
    // Set initial state for words
    gsap.set(words, {
      filter: animation.filter,
      opacity: 0,
      scale: animation.scale || 1,
      x: animation.x || 0,
      y: animation.y || 0,
      force3D: true
    });
    
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
      stagger: animation.stagger,
      force3D: true,
      onStart: () => {
        // console.log('[BLUR ANIMATE] Timeline started');
      },
      onComplete: () => {
        // console.log('[BLUR ANIMATE] Complete');
        heading.classList.add('animated');
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
      console.error('[BLUR ANIMATE] GSAP not loaded!');
      return;
    }
    
    // console.log('[BLUR ANIMATE] Initializing with GSAP', gsap.version);
    
    // Find headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, .subtitle, .page-title');
    
    if (headings.length === 0) {
      // console.warn('[BLUR ANIMATE] No headings found');
      return;
    }
    
    console.log('[BLUR ANIMATE] Found', headings.length, 'headings');
    
    // Create observer
    const observer = new IntersectionObserver(onIntersect, CONFIG.observerOptions);
    
    // Observe each heading
    let count = 0;
    headings.forEach(heading => {
      if (heading.dataset.noAnimate !== undefined) {
        // console.log('[BLUR ANIMATE] Skipping (data-no-animate):', heading.textContent.substring(0, 30));
        return;
      }
      
      heading.classList.add('heading-animate');
      observer.observe(heading);
      count++;
    });
    
    // console.log('[BLUR ANIMATE] Observing', count, 'headings');
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
    animate: animate
  };

})();
