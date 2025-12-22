(function() {
  'use strict';

  // Check if GSAP and ScrollTrigger are available
  if (typeof gsap === 'undefined') {
    console.error('GSAP is required for background color transitions');
    return;
  }

  if (typeof ScrollTrigger === 'undefined') {
    console.error('GSAP ScrollTrigger plugin is required');
    return;
  }

  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // Configuration
  const config = {
    defaultColor: 'transparent', // Default background color
    dataAttribute: 'data-bg-color', // Data attribute to read color from
    duration: 1.5, // Transition duration in seconds
    ease: 'power1.inOut', // Easing function
  };

  // Initialize background color transitions
  function init() {
    const body = document.body;
    
    // Set initial background color
    gsap.set(body, { backgroundColor: config.defaultColor });

    // Find all sections with the data attribute
    const sections = document.querySelectorAll(`[${config.dataAttribute}]`);

    if (sections.length === 0) {
      console.warn(`No sections found with ${config.dataAttribute} attribute`);
      return;
    }

    // Create ScrollTrigger for each section
    sections.forEach((section, index) => {
      const bgColor = section.getAttribute(config.dataAttribute);
      
      if (!bgColor) {
        console.warn('Section has data attribute but no color value:', section);
        return;
      }

      ScrollTrigger.create({
        trigger: section,
        start: 'top center', // When section top hits center of viewport
        end: 'bottom center', // When section bottom hits center of viewport
        
        onEnter: () => {
          gsap.to(body, {
            backgroundColor: bgColor,
            duration: config.duration,
            ease: config.ease,
          });
        },
        
        onEnterBack: () => {
          gsap.to(body, {
            backgroundColor: bgColor,
            duration: config.duration,
            ease: config.ease,
          });
        },
        
        onLeave: () => {
          // Check if there's a next section with bg color
          const nextSection = sections[index + 1];
          if (!nextSection) {
            // Last section - revert to default
            gsap.to(body, {
              backgroundColor: config.defaultColor,
              duration: config.duration,
              ease: config.ease,
            });
          }
        },
        
        onLeaveBack: () => {
          // Check if there's a previous section with bg color
          const prevSection = sections[index - 1];
          if (!prevSection) {
            // First section - revert to default
            gsap.to(body, {
              backgroundColor: config.defaultColor,
              duration: config.duration,
              ease: config.ease,
            });
          }
        },
        
        // Uncomment for debugging
        // markers: true,
      });
    });

    console.log(`Initialized ${sections.length} background color transitions`);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Refresh ScrollTrigger on window resize
  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });
})();
