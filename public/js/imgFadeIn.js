(function() {
  'use strict';

  // Function to render caption from alt attribute
  function renderCaption(img) {
    const alt = img.getAttribute('alt');
    
    // Only proceed if alt exists and is not empty
    if (!alt || alt.trim() === '') {
      return;
    }
    
    // Find the parent picture element
    const picture = img.closest('picture');
    if (!picture) {
      return;
    }
    
    // Check if caption already exists after the picture element
    const nextElement = picture.nextElementSibling;
    if (nextElement && nextElement.classList.contains('image-caption')) {
      return;
    }
    
    // Create caption element
    const caption = document.createElement('span');
    caption.classList.add('image-caption');
    caption.textContent = alt;
    
    // Insert caption after the picture element
    picture.parentNode.insertBefore(caption, picture.nextSibling);
  }

  // Function to handle image fade-in
  function fadeInImage(img) {
    // Add the fade-in class
    img.classList.add('fade-in');
    
    // Render caption from alt attribute
    renderCaption(img);

    // Check if image is already loaded (from cache)
    if (img.complete && img.naturalHeight !== 0) {
      img.classList.add('loaded');
    } else {
      // Wait for image to load
      img.addEventListener('load', function() {
        img.classList.add('loaded');
      });
      
      // Handle errors
      img.addEventListener('error', function() {
        img.classList.add('loaded'); // Still fade in to show broken image
      });
    }
  }

  // Initialize on DOM ready
  function init() {
    // Get all images you want to fade in
    const images = document.querySelectorAll('.gallery-images picture img');

    console.log(`Found ${images.length} images to fade in`);
    
    images.forEach(function(img) {
      fadeInImage(img);
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();