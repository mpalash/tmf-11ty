/**
 * Poster Hover Module (Adapted for Event List)
 * Handles mouse-following poster thumbnails with GSAP
 * Sources images from 11ty-processed thumbnails in the DOM
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        OFFSET_X: 30,
        OFFSET_Y: -180,
        SHOW_DELAY: 0.15,        // Delay before showing poster (seconds)
        SHOW_DURATION: 0.3,       // Duration of fade-in animation
        HIDE_DURATION: 0.2,       // Duration of fade-out animation
        SHOW_EASE: 'power2.out',
        HIDE_EASE: 'power2.out'
    };

    let posterThumbnail;
    let posterImg;
    let currentPosterUrl = null;
    let showTimer = null;

    /**
     * Create poster thumbnail element with picture support
     */
    function createPosterElement() {
        const poster = document.createElement('div');
        poster.id = 'posterThumbnail';
        poster.className = 'poster-thumbnail';
        
        // Create picture element for responsive images
        const picture = document.createElement('picture');
        
        const img = document.createElement('img');
        img.src = '';
        img.alt = '';
        
        picture.appendChild(img);
        poster.appendChild(picture);
        document.body.appendChild(poster);
        
        return poster;
    }

    /**
     * Initialize the poster hover functionality
     */
    function init() {
        // Check if GSAP is loaded
        if (typeof gsap === 'undefined') {
            console.error('GSAP library not loaded');
            return;
        }

        // Get or create poster thumbnail element
        posterThumbnail = document.getElementById('posterThumbnail');
        
        if (!posterThumbnail) {
            posterThumbnail = createPosterElement();
        }

        // Get the img element (might be inside a picture)
        posterImg = posterThumbnail.querySelector('img');

        if (!posterImg) {
            console.error('Poster img element not found');
            return;
        }

        // Attach event listeners to all event list items
        attachEventListeners();
    }

    /**
     * Show the poster thumbnail
     */
    function showPoster(e, posterUrl, posterSrcset, posterSizes) {
        // Clear any pending show timer
        if (showTimer) {
            clearTimeout(showTimer);
        }

        // Kill any ongoing animations
        gsap.killTweensOf(posterThumbnail);

        // Load new poster if different from current
        if (posterUrl !== currentPosterUrl) {
            // If we have srcset, we need to work with picture/source elements
            const picture = posterImg.parentElement;
            
            if (posterSrcset && picture.tagName === 'PICTURE') {
                // Clear existing sources
                const existingSources = picture.querySelectorAll('source');
                existingSources.forEach(function(source) {
                    source.remove();
                });
                
                // Create new source element with the srcset
                const source = document.createElement('source');
                source.srcset = posterSrcset;
                
                if (posterSizes) {
                    source.sizes = posterSizes;
                }
                
                // Insert source before img
                picture.insertBefore(source, posterImg);
            }
            
            // Set img src as fallback
            posterImg.src = posterUrl;
            
            currentPosterUrl = posterUrl;
            posterThumbnail.classList.add('loading');

            // Remove loading state when image loads
            posterImg.onload = function() {
                posterThumbnail.classList.remove('loading');
            };

            posterImg.onerror = function() {
                console.error('Failed to load poster:', posterUrl);
                posterThumbnail.classList.remove('loading');
            };
        }

        // Set initial position
        gsap.set(posterThumbnail, {
            left: e.clientX + CONFIG.OFFSET_X,
            top: e.clientY + CONFIG.OFFSET_Y
        });

        // Delay before showing
        showTimer = setTimeout(function() {
            gsap.to(posterThumbnail, {
                opacity: 1,
                scale: 1,
                duration: CONFIG.SHOW_DURATION,
                ease: CONFIG.SHOW_EASE
            });
        }, CONFIG.SHOW_DELAY * 1000);
    }

    /**
     * Hide the poster thumbnail
     */
    function hidePoster() {
        // Clear any pending show timer
        if (showTimer) {
            clearTimeout(showTimer);
            showTimer = null;
        }

        // Kill any ongoing animations
        gsap.killTweensOf(posterThumbnail);

        // Fade out immediately
        gsap.to(posterThumbnail, {
            opacity: 0,
            scale: 0.8,
            duration: CONFIG.HIDE_DURATION,
            ease: CONFIG.HIDE_EASE
        });

        // Clear current poster URL
        currentPosterUrl = null;
    }

    /**
     * Update poster position to follow cursor
     */
    function updatePosition(e) {
        // Only update if poster is visible or becoming visible
        gsap.set(posterThumbnail, {
            left: e.clientX + CONFIG.OFFSET_X,
            top: e.clientY + CONFIG.OFFSET_Y
        });
    }

    /**
     * Get poster image data from the thumbnail in the DOM
     * Handles both plain img tags and picture elements with source tags
     */
    function getPosterData(item) {
        const thumbnailImg = item.querySelector('.event-thumbnail');

        if (!thumbnailImg) return null;

        const src = thumbnailImg.src || thumbnailImg.getAttribute('src');

        if (!src) return null;

        // Check if img is inside a picture element (11ty-img does this)
        const pictureElement = thumbnailImg.closest('picture');

        let srcset = null;
        let sizes = null;

        if (pictureElement) {
            const sources = pictureElement.querySelectorAll('source');

            // Prefer AVIF, then WebP, then fallback to img srcset
            let selectedSource = null;

            sources.forEach(function(source) {
                const type = source.getAttribute('type');
                if (type === 'image/avif' && !selectedSource) {
                    selectedSource = source;
                } else if (type === 'image/webp' && (!selectedSource || selectedSource.getAttribute('type') !== 'image/avif')) {
                    selectedSource = source;
                }
            });

            if (selectedSource) {
                srcset = selectedSource.getAttribute('srcset');
                sizes = selectedSource.getAttribute('sizes');
            }
        }

        // Fallback to img attributes if no picture/source found
        if (!srcset) {
            srcset = thumbnailImg.srcset || thumbnailImg.getAttribute('srcset');
            sizes = thumbnailImg.sizes || thumbnailImg.getAttribute('sizes');
        }

        return {
            src: src,
            srcset: srcset,
            sizes: sizes
        };
    }

    /**
     * Attach event listeners to all event list items
     */
    function attachEventListeners() {
        const eventItems = document.querySelectorAll('.all-events-list > li');

        if (eventItems.length === 0) return;

        eventItems.forEach(function(item) {
            const posterData = getPosterData(item);

            if (!posterData) return;

            item.addEventListener('mouseenter', function(e) {
                showPoster(e, posterData.src, posterData.srcset, posterData.sizes);
            });

            item.addEventListener('mousemove', function(e) {
                updatePosition(e);
            });

            item.addEventListener('mouseleave', function() {
                hidePoster();
            });
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
