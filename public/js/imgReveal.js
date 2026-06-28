/**
 * Image reveal animation (Phase H1).
 * Markup (.image-reveal-wrapper, data-orientation, aspect padding / 75vh mode)
 * is emitted at build time by components/imageReveal.njk — this script only sets
 * the initial GSAP state and runs the IntersectionObserver-triggered clip-path
 * reveal. No DOM mutation, no layout-affecting style writes (CLS-safe).
 */

(function() {
  'use strict';

  function init() {
    if (typeof gsap === 'undefined') return;

    const containers = document.querySelectorAll('main .image-wrapper .image');
    if (containers.length === 0) return;

    // Initial hidden state: wrapper clipped, image faded + slightly scaled.
    containers.forEach(function(container) {
      const wrapper = container.querySelector('.image-reveal-wrapper');
      if (!wrapper) return;
      const img = wrapper.querySelector('img');
      if (!img) return;

      const orientation = container.getAttribute('data-orientation');
      let initialScale = 1.05;
      if (orientation === 'landscape') initialScale = 1.08;
      else if (orientation === 'portrait') initialScale = 1.03;

      gsap.set(wrapper, { clipPath: 'inset(0 100% 0 0)' });
      gsap.set(img, { opacity: 0, scale: initialScale });
    });

    function revealPreviousImages(currentContainer) {
      const all = document.querySelectorAll('main .image-wrapper .image');
      const currentIndex = Array.from(all).indexOf(currentContainer);

      for (let i = 0; i < currentIndex; i++) {
        const container = all[i];
        if (container.dataset.revealed === 'true') continue;

        const wrapper = container.querySelector('.image-reveal-wrapper');
        if (!wrapper) continue;
        const img = wrapper.querySelector('img');
        if (!img) continue;

        if (img.loading === 'lazy') img.loading = 'eager';
        container.dataset.revealed = 'true';

        gsap.set(img, { opacity: 1, scale: 1 });
        gsap.set(wrapper, { clipPath: 'inset(0 0% 0 0)' });
      }
    }

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;

        const container = entry.target;
        if (container.dataset.revealed === 'true') return;

        // Reveal any unrevealed images above this one instantly.
        revealPreviousImages(container);

        const wrapper = container.querySelector('.image-reveal-wrapper');
        if (!wrapper) return;
        const img = wrapper.querySelector('img');
        if (!img) return;

        if (img.loading === 'lazy') img.loading = 'eager';
        container.dataset.revealed = 'true';

        function triggerAnimation() {
          const orientation = container.getAttribute('data-orientation');
          let revealDuration = 1.2;
          let scaleDuration = 1.2;
          if (orientation === 'portrait') {
            revealDuration = 1.0;
            scaleDuration = 1.0;
          } else if (orientation === 'landscape') {
            revealDuration = 1.4;
            scaleDuration = 1.4;
          }

          gsap.timeline({ defaults: { ease: 'power3.inOut' } })
            .to(img, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
            .to(wrapper, { clipPath: 'inset(0 0% 0 0)', duration: revealDuration, ease: 'power3.inOut' }, 0.2)
            .to(img, { scale: 1, duration: scaleDuration, ease: 'power2.out' }, 0.2);
        }

        if (img.complete && img.naturalHeight !== 0) {
          triggerAnimation();
        } else {
          img.addEventListener('load', triggerAnimation, { once: true });
          img.addEventListener('error', triggerAnimation, { once: true });
        }

        observer.unobserve(container);
      });
    }, {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    });

    containers.forEach(function(container) {
      observer.observe(container);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
