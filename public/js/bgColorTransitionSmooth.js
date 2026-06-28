/**
 * Background color transitions via GSAP ScrollTrigger (scrubbed).
 * Each [data-bg-color] section tweens body.style.backgroundColor from the
 * previous section's color to its own as it scrolls toward centre. ScrollTrigger
 * is driven by Lenis (see smoothScroll.js: lenis.on('scroll', ScrollTrigger.update)),
 * so this is declarative — no per-frame ticker, no manual scroll/resize handling.
 */

(function() {
  'use strict';

  if (typeof gsap === 'undefined') {
    console.error('GSAP is required for background color transitions');
    return;
  }
  if (typeof ScrollTrigger === 'undefined') {
    console.error('GSAP ScrollTrigger plugin is required');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const DEFAULT_COLOR = '#ffffff';

  function init() {
    const sections = gsap.utils.toArray('[data-bg-color]');
    if (sections.length === 0) return;

    // Start at the default color; each section tweens from the previous color.
    gsap.set(document.body, { backgroundColor: DEFAULT_COLOR });

    let prevColor = DEFAULT_COLOR;

    sections.forEach((section) => {
      const color = section.getAttribute('data-bg-color');
      if (!color) {
        console.warn('Section has data-bg-color attribute but no value:', section);
        return;
      }

      gsap.fromTo(
        document.body,
        { backgroundColor: prevColor },
        {
          backgroundColor: color,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'center center',
            scrub: 0.5
          }
        }
      );

      prevColor = color;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
