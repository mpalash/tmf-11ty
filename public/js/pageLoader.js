// Minimal Page Loading Indicator
// Creates a 16px thick black bar that animates from left to right during page load

(function() {
  'use strict';

  // Create the loading bar element
  function createLoadingBar() {
    // Remove existing bar if present
    const existing = document.getElementById('page-loading-bar');
    if (existing) {
      existing.remove();
    }

    const bar = document.createElement('div');
    bar.id = 'page-loading-bar';
    bar.style.cssText = `
      position: fixed;
      top: 32px;
      left: 0;
      width: 0%;
      height: 4px;
      background-color: #c12640;
      z-index: 9999;
      transition: width 0.3s ease-out, opacity 0.3s ease-out;
      opacity: 1;
    `;
    
    // Make sure body exists before appending
    if (document.body) {
      document.body.appendChild(bar);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(bar);
      });
    }
    
    return bar;
  }

  // Update loading bar progress
  function updateProgress(bar, progress) {
    if (bar && bar.parentNode) {
      bar.style.width = `${progress}%`;
    }
  }

  // Complete and hide loading bar
  function completeLoading(bar) {
    if (!bar || !bar.parentNode) return;
    
    bar.style.width = '100%';
    
    setTimeout(() => {
      bar.style.opacity = '0';
      
      setTimeout(() => {
        if (bar.parentNode) {
          bar.parentNode.removeChild(bar);
        }
      }, 300);
    }, 200);
  }

  // Initialize loading indicator
  function init() {
    // Start the loader
    const startLoader = () => {
      const loadingBar = createLoadingBar();
      let progress = 0;

      // Initial progress
      updateProgress(loadingBar, 10);

      // Track resource loading
      const resourcesTotal = document.querySelectorAll('img, link[rel="stylesheet"], script').length;
      let resourcesLoaded = 0;

      // Update progress based on loaded resources
      function onResourceLoad() {
        resourcesLoaded++;
        const resourceProgress = (resourcesLoaded / Math.max(resourcesTotal, 1)) * 60;
        progress = Math.max(progress, 10 + resourceProgress);
        updateProgress(loadingBar, progress);
      }

      // Add listeners to track resource loading
      document.querySelectorAll('img').forEach(img => {
        if (img.complete) {
          onResourceLoad();
        } else {
          img.addEventListener('load', onResourceLoad);
          img.addEventListener('error', onResourceLoad);
        }
      });

      document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        link.addEventListener('load', onResourceLoad);
        link.addEventListener('error', onResourceLoad);
      });

      document.querySelectorAll('script').forEach(script => {
        if (!script.src || script.async) {
          onResourceLoad();
        } else {
          script.addEventListener('load', onResourceLoad);
          script.addEventListener('error', onResourceLoad);
        }
      });

      // DOMContentLoaded - 80% progress
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          progress = Math.max(progress, 80);
          updateProgress(loadingBar, progress);
        });
      } else {
        progress = Math.max(progress, 80);
        updateProgress(loadingBar, progress);
      }

      // Window load - complete
      if (document.readyState === 'complete') {
        completeLoading(loadingBar);
      } else {
        window.addEventListener('load', () => {
          completeLoading(loadingBar);
        });
      }

      // Fallback timeout (5 seconds max)
      setTimeout(() => {
        if (loadingBar.parentNode) {
          completeLoading(loadingBar);
        }
      }, 5000);
    };

    // Start loader when DOM is ready
    if (document.body) {
      startLoader();
    } else {
      document.addEventListener('DOMContentLoaded', startLoader);
    }
  }

  // Run when script loads
  init();
})();
