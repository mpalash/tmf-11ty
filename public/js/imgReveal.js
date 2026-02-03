/**
 * GSAP Image Reveal Animation with Orientation Detection
 * Uses clip-path for true masked reveal without scaling
 * DOM Structure: .image-wrapper > .images > [.image, .image, .image, ...]
 * Each .image contains one <picture> element
 * Plays only once when images enter viewport
 * Adds data-orientation attribute based on aspect ratio
 * 
 * 75vh rule: Applied ONLY to fullWidth + (portrait OR square) images
 * Landscape images always use natural aspect ratio
 */

(function() {
  'use strict';

  // Initialize when DOM is ready
  function init() {
    // Check if GSAP is loaded
    if (typeof gsap === 'undefined') {
      // console.error('GSAP not loaded. Please include GSAP library.');
      return;
    }

    // Find all .image containers with picture elements
    const imageContainers = document.querySelectorAll('main .image-wrapper .image');
    
    if (imageContainers.length === 0) {
      console.log('No image containers found to animate');
      return;
    }

    console.log(`Found ${imageContainers.length} image containers to animate`);

    // Apply initial styles and setup for each .image container
    imageContainers.forEach(function(imageContainer) {
      // Find the picture element inside this .image container
      const picture = imageContainer.querySelector('picture');
      
      if (!picture) {
        console.warn('Image container has no picture element, skipping:', imageContainer);
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

      // Get image dimensions from attributes
      const imgWidth = parseFloat(img.getAttribute('width'));
      const imgHeight = parseFloat(img.getAttribute('height'));
      
      // Check if parent has fullWidth layout
      const imageWrapper = imageContainer.closest('.image-wrapper');
      const isFullWidth = imageWrapper && imageWrapper.getAttribute('data-layout') === 'fullWidth';
      
      if (imgWidth && imgHeight) {
        // Calculate aspect ratio
        const aspectRatio = imgWidth / imgHeight;
        
        // Determine orientation and add data attribute
        let orientation;
        if (aspectRatio > 1.2) {
          orientation = 'landscape';
        } else if (aspectRatio < 0.8) {
          orientation = 'portrait';
        } else {
          orientation = 'square';
        }
        
        // Add orientation data attribute to the image container
        imageContainer.setAttribute('data-orientation', orientation);
        
        // Also add to the wrapper for styling flexibility
        wrapper.setAttribute('data-orientation', orientation);
        
        // console.log(`Image orientation: ${orientation} (aspect ratio: ${aspectRatio.toFixed(3)})`, img.alt || img.src);
        
        // Apply 75vh rule ONLY to fullWidth + (portrait OR square) images
        const shouldUse75vh = isFullWidth && (orientation === 'portrait' || orientation === 'square');
        
        if (shouldUse75vh) {
          // For fullWidth portrait/square: height is 75vh, width is auto (maintains aspect ratio)
          wrapper.style.display = 'flex';
          wrapper.style.alignItems = 'start';
          wrapper.style.justifyContent = 'start';
          wrapper.style.height = '75vh';
          wrapper.style.minHeight = '75vh';
          
          // Picture should be sized to maintain aspect ratio
          picture.style.height = '100%';
          picture.style.width = 'auto';
          picture.style.maxWidth = '100%';
          
          // console.log(`75vh layout applied (fullWidth ${orientation}):`, img.alt || img.src);
        } else {
          // Standard layout: use aspect ratio padding technique
          // This applies to:
          // - All non-fullWidth images (regardless of orientation)
          // - FullWidth landscape images (they use natural aspect ratio)
          const paddingRatio = imgHeight / imgWidth;
          
          wrapper.style.paddingBottom = (paddingRatio * 100) + '%';
          wrapper.style.position = 'relative';
          wrapper.style.height = '0';
          
          // Position picture absolutely inside wrapper
          picture.style.position = 'absolute';
          picture.style.top = '0';
          picture.style.left = '0';
          picture.style.width = '100%';
          picture.style.height = '100%';
          
          // Apply different object-fit based on orientation
          if (orientation === 'portrait') {
            img.style.objectFit = 'cover';
            img.style.objectPosition = 'center';
          } else if (orientation === 'landscape') {
            img.style.objectFit = 'contain';
            img.style.objectPosition = 'center';
          } else {
            // Square
            img.style.objectFit = 'cover';
            img.style.objectPosition = 'center';
          }
          
          if (isFullWidth && orientation === 'landscape') {
            // console.log(`Natural aspect ratio layout (fullWidth landscape):`, img.alt || img.src);
          }
        }
      } else {
        console.warn('Image missing width/height attributes:', img.src);
        // Default to unknown orientation
        imageContainer.setAttribute('data-orientation', 'unknown');
        wrapper.setAttribute('data-orientation', 'unknown');
      }

      // Set initial state: wrapper clipped to 0% width (left to right reveal)
      gsap.set(wrapper, {
        clipPath: 'inset(0 100% 0 0)' // top right bottom left
      });

      // Set initial state: image slightly scaled and transparent
      // Use different scale values based on orientation
      const orientation = imageContainer.getAttribute('data-orientation');
      let initialScale = 1.05; // default
      
      if (orientation === 'landscape') {
        initialScale = 1.08; // More dramatic for landscape
      } else if (orientation === 'portrait') {
        initialScale = 1.03; // Subtle for portrait
      }
      
      gsap.set(img, {
        opacity: 0,
        scale: initialScale
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
            // console.log('Changing lazy to eager for:', img.alt || img.src);
            img.loading = 'eager';
          }

          // Mark as revealed to prevent re-animation
          imageContainer.dataset.revealed = 'true';

          // console.log('Image in viewport, waiting for load:', img.alt || img.src);

          // Function to trigger the animation
          function triggerAnimation() {
            // console.log('Image loaded, revealing:', img.alt || img.src);

            // Get orientation for animation customization
            const orientation = imageContainer.getAttribute('data-orientation');

            // Customize animation timing based on orientation
            let revealDuration = 1.2;
            let scaleDuration = 1.2;
            
            if (orientation === 'portrait') {
              revealDuration = 1.0; // Faster reveal for portrait
              scaleDuration = 1.0;
            } else if (orientation === 'landscape') {
              revealDuration = 1.4; // Slower, more dramatic for landscape
              scaleDuration = 1.4;
            }

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
              duration: revealDuration,
              ease: 'power3.inOut'
            }, 0.2)
            .to(img, {
              scale: 1,
              duration: scaleDuration,
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
              // console.warn('Image failed to load, revealing anyway:', img.src);
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
          // console.log('Changing lazy to eager (previous image):', img.alt || img.src);
          img.loading = 'eager';
        }
        
        // Mark as revealed
        container.dataset.revealed = 'true';
        
        // console.log('Instantly revealing previous image:', img.alt || img.src);
        
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