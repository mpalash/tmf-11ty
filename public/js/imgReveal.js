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
    if (typeof gsap === 'undefined') return;

    // Find all .image containers with picture elements
    const imageContainers = document.querySelectorAll('main .image-wrapper .image');

    if (imageContainers.length === 0) return;

    // Apply initial styles and setup for each .image container
    imageContainers.forEach(function(imageContainer) {
      const picture = imageContainer.querySelector('picture');

      if (!picture) {
        console.warn('Image container has no picture element, skipping:', imageContainer);
        return;
      }

      // Skip if already animated
      if (imageContainer.dataset.revealed === 'true') return;

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

        imageContainer.setAttribute('data-orientation', orientation);
        wrapper.setAttribute('data-orientation', orientation);

        // Apply 75vh rule ONLY to fullWidth + (portrait OR square) images
        const shouldUse75vh = isFullWidth && (orientation === 'portrait' || orientation === 'square');

        if (shouldUse75vh) {
          wrapper.style.display = 'flex';
          wrapper.style.alignItems = 'start';
          wrapper.style.justifyContent = 'start';
          wrapper.style.height = '75vh';
          wrapper.style.minHeight = '75vh';

          picture.style.height = '100%';
          picture.style.width = 'auto';
          picture.style.maxWidth = '100%';
        } else {
          // Standard layout: use aspect ratio padding technique
          const paddingRatio = imgHeight / imgWidth;

          wrapper.style.paddingBottom = (paddingRatio * 100) + '%';
          wrapper.style.position = 'relative';
          wrapper.style.height = '0';

          picture.style.position = 'absolute';
          picture.style.top = '0';
          picture.style.left = '0';
          picture.style.width = '100%';
          picture.style.height = '100%';

          if (orientation === 'portrait') {
            img.style.objectFit = 'cover';
            img.style.objectPosition = 'center';
          } else if (orientation === 'landscape') {
            img.style.objectFit = 'contain';
            img.style.objectPosition = 'center';
          } else {
            img.style.objectFit = 'cover';
            img.style.objectPosition = 'center';
          }
        }
      } else {
        console.warn('Image missing width/height attributes:', img.src);
        imageContainer.setAttribute('data-orientation', 'unknown');
        wrapper.setAttribute('data-orientation', 'unknown');
      }

      // Set initial state: wrapper clipped to 0% width (left to right reveal)
      gsap.set(wrapper, {
        clipPath: 'inset(0 100% 0 0)'
      });

      // Set initial state: image slightly scaled and transparent
      const orientation = imageContainer.getAttribute('data-orientation');
      let initialScale = 1.05;

      if (orientation === 'landscape') {
        initialScale = 1.08;
      } else if (orientation === 'portrait') {
        initialScale = 1.03;
      }

      gsap.set(img, {
        opacity: 0,
        scale: initialScale
      });
    });

    // Setup Intersection Observer for scroll-triggered animations
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const imageContainer = entry.target;

          if (imageContainer.dataset.revealed === 'true') return;

          // Reveal any unrevealed images above this one
          revealPreviousImages(imageContainer);

          const wrapper = imageContainer.querySelector('.image-reveal-wrapper');
          if (!wrapper) return;

          const picture = wrapper.querySelector('picture');
          if (!picture) return;

          const img = picture.querySelector('img');
          if (!img) return;

          if (img.loading === 'lazy') {
            img.loading = 'eager';
          }

          imageContainer.dataset.revealed = 'true';

          function triggerAnimation() {
            const orientation = imageContainer.getAttribute('data-orientation');

            let revealDuration = 1.2;
            let scaleDuration = 1.2;

            if (orientation === 'portrait') {
              revealDuration = 1.0;
              scaleDuration = 1.0;
            } else if (orientation === 'landscape') {
              revealDuration = 1.4;
              scaleDuration = 1.4;
            }

            const tl = gsap.timeline({
              defaults: { ease: 'power3.inOut' }
            });

            tl.to(img, {
              opacity: 1,
              duration: 0.3,
              ease: 'power2.out'
            }, 0)
            .to(wrapper, {
              clipPath: 'inset(0 0% 0 0)',
              duration: revealDuration,
              ease: 'power3.inOut'
            }, 0.2)
            .to(img, {
              scale: 1,
              duration: scaleDuration,
              ease: 'power2.out'
            }, 0.2);
          }

          if (img.complete && img.naturalHeight !== 0) {
            triggerAnimation();
          } else {
            img.addEventListener('load', triggerAnimation, { once: true });
            img.addEventListener('error', function() {
              triggerAnimation();
            }, { once: true });
          }

          observer.unobserve(imageContainer);
        }
      });
    }, observerOptions);

    // Helper function to reveal all images above the current one
    function revealPreviousImages(currentContainer) {
      const allContainers = document.querySelectorAll('main .images .image');
      const currentIndex = Array.from(allContainers).indexOf(currentContainer);

      for (let i = 0; i < currentIndex; i++) {
        const container = allContainers[i];

        if (container.dataset.revealed === 'true') continue;

        const wrapper = container.querySelector('.image-reveal-wrapper');
        if (!wrapper) continue;

        const picture = wrapper.querySelector('picture');
        if (!picture) continue;

        const img = picture.querySelector('img');
        if (!img) continue;

        if (img.loading === 'lazy') {
          img.loading = 'eager';
        }

        container.dataset.revealed = 'true';

        gsap.set(img, { opacity: 1, scale: 1 });
        gsap.set(wrapper, { clipPath: 'inset(0 0% 0 0)' });
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
