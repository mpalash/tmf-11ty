(function() {
  'use strict';

  // CSS styles for the slide up and fade in animation
  const style = document.createElement('style');
  style.textContent = `
    [data-animate] {
      opacity: 0;
      transform: translateY(128px);
      transition: opacity 0.6s ease-out, transform 0.8s ease-out;
    }
    
    [data-animate].animated {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  // Function to animate element
  function animateElement(element) {
    if (element.classList.contains('animated')) {
      return; // Already animated
    }
    
    element.classList.add('animated');
  }

  // Initialize Intersection Observer
  function init() {
    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      console.warn('Intersection Observer not supported, elements will appear immediately');
      // Fallback: show all elements immediately
      const elements = document.querySelectorAll('[data-animate]');
      elements.forEach(function(element) {
        animateElement(element);
      });
      return;
    }
    
    // Configure Intersection Observer
    const options = {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0.15 // Trigger when 15% of element is visible
    };
    
    // Create observer
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          // Get delay from data attribute if specified
          const delay = parseInt(entry.target.getAttribute('data-animate-delay')) || 0;
          
          if (delay > 0) {
            setTimeout(function() {
              animateElement(entry.target);
            }, delay);
          } else {
            animateElement(entry.target);
          }
          
          // Stop observing once animated (element won't animate again)
          observer.unobserve(entry.target);
        }
      });
    }, options);
    
    // Observe all elements with data-animate attribute
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(function(element) {
      observer.observe(element);
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();