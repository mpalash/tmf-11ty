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
    defaultColor: '#ffffff', // Default background color (start/end)
    dataAttribute: 'data-bg-color', // Data attribute to read color from
    smoothness: 0.1, // Lower = smoother but slightly more lag (0.05-0.3 recommended)
  };

  // Convert hex to RGB object
  function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle shorthand hex
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
  }

  // Interpolate between two RGB colors
  function interpolateColor(color1, color2, factor) {
    const result = {
      r: Math.round(color1.r + factor * (color2.r - color1.r)),
      g: Math.round(color1.g + factor * (color2.g - color1.g)),
      b: Math.round(color1.b + factor * (color2.b - color1.b))
    };
    return `rgb(${result.r}, ${result.g}, ${result.b})`;
  }

  // Initialize continuous background color transitions
  function init() {
    const body = document.body;
    
    // Find all sections with the data attribute
    const sections = document.querySelectorAll(`[${config.dataAttribute}]`);

    if (sections.length === 0) {
      console.warn(`No sections found with ${config.dataAttribute} attribute`);
      return;
    }

    // Build color map with scroll positions
    const colorStops = [];
    
    // Add initial default color at the very top
    colorStops.push({
      scrollPos: 0,
      color: hexToRgb(config.defaultColor),
      element: null
    });

    sections.forEach((section) => {
      const bgColor = section.getAttribute(config.dataAttribute);
      
      if (!bgColor) {
        console.warn('Section has data attribute but no color value:', section);
        return;
      }

      const rect = section.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Calculate the scroll position when section center hits viewport center
      const sectionTop = rect.top + scrollTop;
      const sectionHeight = rect.height;
      const sectionCenter = sectionTop + (sectionHeight / 2);
      const viewportCenter = window.innerHeight / 2;
      const scrollPosition = sectionCenter - viewportCenter;
      
      colorStops.push({
        scrollPos: Math.max(0, scrollPosition),
        color: hexToRgb(bgColor),
        element: section
      });
    });

    // Find the last section within <main> element
    const mainElement = document.querySelector('main');
    let lastMainSection = null;
    
    if (mainElement) {
      const sectionsInMain = Array.from(sections).filter(section => 
        mainElement.contains(section)
      );
      lastMainSection = sectionsInMain[sectionsInMain.length - 1];
    }
    
    // If last section in main has a color, maintain it to the end
    // Otherwise, revert to default color
    const lastSection = sections[sections.length - 1];
    if (lastSection) {
      const rect = lastSection.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const sectionBottom = rect.top + scrollTop + rect.height;
      const finalScrollPos = sectionBottom + window.innerHeight;
      
      // Check if the last section in main has a background color
      const lastMainColor = lastMainSection ? lastMainSection.getAttribute(config.dataAttribute) : null;
      
      colorStops.push({
        scrollPos: finalScrollPos,
        color: lastMainColor ? hexToRgb(lastMainColor) : hexToRgb(config.defaultColor),
        element: null,
        isEnd: true
      });
    }

    // Sort color stops by scroll position
    colorStops.sort((a, b) => a.scrollPos - b.scrollPos);

    // Current and target color for smooth interpolation
    let currentColor = { ...colorStops[0].color };
    let targetColor = { ...colorStops[0].color };

    // Update background color based on scroll position
    function updateBackgroundColor() {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      // Find which two color stops we're between
      let startStop = colorStops[0];
      let endStop = colorStops[colorStops.length - 1];
      
      for (let i = 0; i < colorStops.length - 1; i++) {
        if (scrollY >= colorStops[i].scrollPos && scrollY <= colorStops[i + 1].scrollPos) {
          startStop = colorStops[i];
          endStop = colorStops[i + 1];
          break;
        } else if (scrollY < colorStops[0].scrollPos) {
          startStop = colorStops[0];
          endStop = colorStops[0];
          break;
        } else if (scrollY > colorStops[colorStops.length - 1].scrollPos) {
          startStop = colorStops[colorStops.length - 1];
          endStop = colorStops[colorStops.length - 1];
          break;
        }
      }
      
      // Calculate interpolation factor
      let factor = 0;
      if (endStop.scrollPos !== startStop.scrollPos) {
        factor = (scrollY - startStop.scrollPos) / (endStop.scrollPos - startStop.scrollPos);
        factor = Math.max(0, Math.min(1, factor)); // Clamp between 0 and 1
      }
      
      // Calculate target color
      targetColor = {
        r: startStop.color.r + factor * (endStop.color.r - startStop.color.r),
        g: startStop.color.g + factor * (endStop.color.g - startStop.color.g),
        b: startStop.color.b + factor * (endStop.color.b - startStop.color.b)
      };
      
      // Smoothly interpolate current color towards target
      currentColor.r += (targetColor.r - currentColor.r) * config.smoothness;
      currentColor.g += (targetColor.g - currentColor.g) * config.smoothness;
      currentColor.b += (targetColor.b - currentColor.b) * config.smoothness;
      
      // Apply the color
      const rgbColor = `rgb(${Math.round(currentColor.r)}, ${Math.round(currentColor.g)}, ${Math.round(currentColor.b)})`;
      body.style.backgroundColor = rgbColor;
    }

    // Use GSAP ticker for smooth 60fps updates
    gsap.ticker.add(updateBackgroundColor);

    // Recalculate positions on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Rebuild color stops with new positions
        colorStops.length = 0;
        
        colorStops.push({
          scrollPos: 0,
          color: hexToRgb(config.defaultColor),
          element: null
        });

        sections.forEach((section) => {
          const bgColor = section.getAttribute(config.dataAttribute);
          if (!bgColor) return;

          const rect = section.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const sectionTop = rect.top + scrollTop;
          const sectionHeight = rect.height;
          const sectionCenter = sectionTop + (sectionHeight / 2);
          const viewportCenter = window.innerHeight / 2;
          const scrollPosition = sectionCenter - viewportCenter;
          
          colorStops.push({
            scrollPos: Math.max(0, scrollPosition),
            color: hexToRgb(bgColor),
            element: section
          });
        });

        // Find the last section within <main> element
        const mainElement = document.querySelector('main');
        let lastMainSection = null;
        
        if (mainElement) {
          const sectionsInMain = Array.from(sections).filter(section => 
            mainElement.contains(section)
          );
          lastMainSection = sectionsInMain[sectionsInMain.length - 1];
        }

        const lastSection = sections[sections.length - 1];
        if (lastSection) {
          const rect = lastSection.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const sectionBottom = rect.top + scrollTop + rect.height;
          const finalScrollPos = sectionBottom + window.innerHeight;
          
          // Check if the last section in main has a background color
          const lastMainColor = lastMainSection ? lastMainSection.getAttribute(config.dataAttribute) : null;
          
          colorStops.push({
            scrollPos: finalScrollPos,
            color: lastMainColor ? hexToRgb(lastMainColor) : hexToRgb(config.defaultColor),
            element: null,
            isEnd: true
          });
        }

        colorStops.sort((a, b) => a.scrollPos - b.scrollPos);
      }, 250);
    });

    // Initial update
    updateBackgroundColor();

    console.log(`Initialized continuous background color transitions with ${colorStops.length} color stops`);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();