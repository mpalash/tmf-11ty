/**
 * Hero Video Mask Reveal
 * Handles the video mask reveal effect on the hero image.
 * Replaces inline onload handler for reliability.
 */
(function() {
  'use strict';

  var img = document.getElementById('hero-img');
  var video = document.getElementById('hero-mask');

  if (!img || !video) return;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealWithVideo() {
    video.style.opacity = '1';
    video.currentTime = 0;
    video.play().catch(function() {
      // Autoplay blocked — hide video, show image only
      video.style.display = 'none';
    });
    img.style.opacity = '1';
  }

  function revealStatic() {
    video.style.display = 'none';
    img.style.opacity = '1';
  }

  function onImageReady() {
    if (prefersReducedMotion) {
      revealStatic();
    } else {
      revealWithVideo();
    }
  }

  if (img.complete && img.naturalHeight !== 0) {
    onImageReady();
  } else {
    img.addEventListener('load', onImageReady, { once: true });
    img.addEventListener('error', function() {
      img.style.opacity = '1';
      video.style.display = 'none';
    }, { once: true });
  }
})();
