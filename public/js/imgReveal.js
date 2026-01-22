/**
 * GSAP Image Reveal Animation
 * Uses clip-path for true masked reveal without scaling
 * DOM Structure: .image-wrapper > .images > [.image, .image, .image, ...]
 * Each .image contains one <picture> element
 * Plays only once when images enter viewport
 */

(function() {
  'use strict';

  // Initialize when DOM is ready
  function init() {
    // Check if GSAP is loaded
    if (typeof gsap === 'undefined') {
      console.error('GSAP not loaded. Please include GSAP library.');
      return;
    }

    // Find all .image containers with picture elements
    const imageContainers = document.querySelectorAll('main .images .image');
    
    if (imageContainers.length === 0) {
      console.log('No .image containers found to animate');
      return;
    }

    console.log(`Found ${imageContainers.length} .image containers to animate`);

    // Apply initial styles and setup for each .image container
    imageContainers.forEach(function(imageContainer) {
      // Find the picture element inside this .image container
      const picture = imageContainer.querySelector('picture');
      
      if (!picture) {
        console.warn('.image container has no picture element, skipping:', imageContainer);
        return;
      }

      // Skip if already animated
      if (imageContainer.dataset.revealed === 'true') {
        return;
      }

      const img = picture.querySelector('img');
      if (!img) {
        console.warn('Picture element has no img, skipping:', picture);
        return;
      }

      // Create wrapper for clip-path animation
      const wrapper = document.createElement('div');
      wrapper.className = 'image-reveal-wrapper';
      
      // Insert wrapper before the picture and move picture inside
      picture.parentNode.insertBefore(wrapper, picture);
      wrapper.appendChild(picture);

      // Set initial state: wrapper clipped to 0% width (left to right reveal)
      gsap.set(wrapper, {
        clipPath: 'inset(0 100% 0 0)' // top right bottom left
      });

      // Set initial state: image slightly scaled and transparent
      gsap.set(img, {
        opacity: 0,
        scale: 1.05
      });
    });

    // Setup Intersection Observer for scroll-triggered animations
    // IMPORTANT: Observe .image containers (not wrappers) because wrappers start clipped
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px', // Trigger slightly before entering viewport
      threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const imageContainer = entry.target;
          
          // Skip if already revealed
          if (imageContainer.dataset.revealed === 'true') {
            return;
          }

          // Check if there are unrevealed images above this one
          // If user scrolled past images, reveal all previous ones
          revealPreviousImages(imageContainer);

          // Find the wrapper inside this .image container
          const wrapper = imageContainer.querySelector('.image-reveal-wrapper');
          if (!wrapper) return;
          
          // Find the picture element inside the wrapper
          const picture = wrapper.querySelector('picture');
          if (!picture) return;
          
          const img = picture.querySelector('img');
          if (!img) return;

          // IMPORTANT: Change lazy loading to eager when image enters viewport
          // This ensures the image will load even though it's clipped
          if (img.loading === 'lazy') {
            console.log('Changing lazy to eager for:', img.alt || img.src);
            img.loading = 'eager';
          }

          // Mark as revealed to prevent re-animation
          imageContainer.dataset.revealed = 'true';

          console.log('Image in viewport, waiting for load:', img.alt || img.src);

          // Function to trigger the animation
          function triggerAnimation() {
            console.log('Image loaded, revealing:', img.alt || img.src);

            // Create timeline for sequenced animation
            const tl = gsap.timeline({
              defaults: {
                ease: 'power3.inOut'
              }
            });

            // Reveal sequence:
            // 1. Fade in image
            // 2. Animate clip-path from left to right (revealing image)
            // 3. Scale image back to normal size
            tl.to(img, {
              opacity: 1,
              duration: 0.3,
              ease: 'power2.out'
            }, 0)
            .to(wrapper, {
              clipPath: 'inset(0 0% 0 0)', // Reveal fully
              duration: 1.2,
              ease: 'power3.inOut'
            }, 0.2)
            .to(img, {
              scale: 1,
              duration: 1.2,
              ease: 'power2.out'
            }, 0.2);
          }

          // Check if image is already loaded (cached)
          if (img.complete && img.naturalHeight !== 0) {
            // Image already loaded, trigger immediately
            triggerAnimation();
          } else {
            // Wait for image to load
            img.addEventListener('load', triggerAnimation, { once: true });
            
            // Also handle error case - still reveal but log the error
            img.addEventListener('error', function() {
              console.warn('Image failed to load, revealing anyway:', img.src);
              triggerAnimation();
            }, { once: true });
          }

          // Stop observing this .image container
          observer.unobserve(imageContainer);
        }
      });
    }, observerOptions);

    // Helper function to reveal all images above the current one
    function revealPreviousImages(currentContainer) {
      const allContainers = document.querySelectorAll('main .images .image');
      const currentIndex = Array.from(allContainers).indexOf(currentContainer);
      
      // Reveal all previous unrevealed images instantly
      for (let i = 0; i < currentIndex; i++) {
        const container = allContainers[i];
        
        // Skip if already revealed
        if (container.dataset.revealed === 'true') {
          continue;
        }
        
        const wrapper = container.querySelector('.image-reveal-wrapper');
        if (!wrapper) continue;
        
        const picture = wrapper.querySelector('picture');
        if (!picture) continue;
        
        const img = picture.querySelector('img');
        if (!img) continue;
        
        // Change lazy loading to eager for skipped images
        if (img.loading === 'lazy') {
          console.log('Changing lazy to eager (previous image):', img.alt || img.src);
          img.loading = 'eager';
        }
        
        // Mark as revealed
        container.dataset.revealed = 'true';
        
        console.log('Instantly revealing previous image:', img.alt || img.src);
        
        // Instantly reveal (no animation)
        gsap.set(img, {
          opacity: 1,
          scale: 1
        });
        
        gsap.set(wrapper, {
          clipPath: 'inset(0 0% 0 0)'
        });
      }
    }

    // Observe .image containers (not wrappers - wrappers are clipped and invisible!)
    imageContainers.forEach(function(container) {
      observer.observe(container);
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();