document.addEventListener('DOMContentLoaded', function() {
    // Check if .splide element exists before initializing modal
    if (document.querySelector('.splide')) {
        initializeImageModal();
    }
});

const modalHTML = `
<div id="imageModal" class="modal">
    <button class="modal-prev">
        <svg width="52" height="108" viewBox="0 0 52 108" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M14.8906 51.8906L32.8906 33.8906C34.0156 32.6719 35.9844 32.6719 37.1094 33.8906C38.3281 35.0156 38.3281 36.9844 37.1094 38.1094L21.2656 53.9531L37.1094 69.8906C38.3281 71.0156 38.3281 72.9844 37.1094 74.1094C35.9844 75.3281 34.0156 75.3281 32.8906 74.1094L14.8906 56.1094C13.6719 54.9844 13.6719 53.0156 14.8906 51.8906Z" fill="#DCDCDC"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M49 82V26C49 13.2975 38.7025 3 26 3C13.2975 3 3 13.2974 3 26V82C3 94.7025 13.2975 105 26 105C38.7025 105 49 94.7026 49 82ZM26 0C11.6406 0 0 11.6406 0 26V82C0 96.3594 11.6406 108 26 108C40.3594 108 52 96.3594 52 82V26C52 11.6406 40.3594 0 26 0Z" fill="#DCDCDC"/> </svg>
    </button>
    <button class="modal-next">
        <svg width="52" height="108" viewBox="0 0 52 108" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M37.1094 51.8906C38.3281 53.0156 38.3281 54.9844 37.1094 56.1094L19.1094 74.1094C17.9844 75.3281 16.0156 75.3281 14.8906 74.1094C13.6719 72.9844 13.6719 71.0156 14.8906 69.8906L30.7344 53.9531L14.8906 38.1094C13.6719 36.9844 13.6719 35.0156 14.8906 33.8906C16.0156 32.6719 17.9844 32.6719 19.1094 33.8906L37.1094 51.8906Z" fill="#DCDCDC"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M49 82V26C49 13.2975 38.7025 3 26 3C13.2975 3 3 13.2974 3 26V82C3 94.7025 13.2975 105 26 105C38.7025 105 49 94.7026 49 82ZM26 0C11.6406 0 0 11.6406 0 26V82C0 96.3594 11.6406 108 26 108C40.3594 108 52 96.3594 52 82V26C52 11.6406 40.3594 0 26 0Z" fill="#DCDCDC"/> </svg>
    </button>
    <img class="modal-content" id="modalImage">
    <div class="modal-footer">
        <span id="imageCaption"></span>
        <span class="modal-close-button">Exit</span>
    </div>
</div>
`;

function initializeImageModal() {
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const header = document.querySelector('header');
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const prevBtn = document.querySelector('.modal-prev');
    const nextBtn = document.querySelector('.modal-next');
    const captionText = document.getElementById('imageCaption');
    const closeButton = document.querySelector('#imageModal .modal-close-button');

    const splide = new Splide('.splide', {
        type: 'loop',
        perPage: 3,
        gap: 0,
        pagination: false,
        breakpoints: {
            640: {
                perPage: 2,
            },
            480: {
                perPage: 1,
            },
        }
    });

    splide.on('mounted', function() {
        const slides = document.querySelectorAll('.splide__slide img');
        slides.forEach((img, index) => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', function() {
                openModalWithImage(this, index);
            });
        });
    });

    // Store references for arrow navigation
    let currentSlideIndex = 0;
    let splideInstance = splide;
    let slides = [];

    // Add click handlers to all images in the Splide carousel
    const carouselImages = document.querySelectorAll('.splide img');
    slides = Array.from(carouselImages);

    function openModalWithImage(imgElement, index) {
        currentSlideIndex = index;
        modalImg.src = imgElement.src;
        captionText.textContent = imgElement.alt;
        document.body.style.overflow = 'hidden';

        // Trigger fade in
        requestAnimationFrame(() => {
            modal.classList.add('show');
            header.classList.add('visible');
        });
    }

    function navigateModal(direction) {
        // Calculate new index with wrap-around
        const totalSlides = slides.length;
        let newIndex = currentSlideIndex + direction;

        // Handle wrap-around
        if (newIndex < 0) newIndex = totalSlides - 1;
        if (newIndex >= totalSlides) newIndex = 0;

        // Only update if we actually changed slides
        if (newIndex !== currentSlideIndex) {
            currentSlideIndex = newIndex;
            const newImage = slides[currentSlideIndex];

            // Update modal with fade transition
            modalImg.style.opacity = '0';
            captionText.style.opacity = '0';

            setTimeout(() => {
                modalImg.src = newImage.src;
                captionText.textContent = newImage.alt;
                modalImg.style.opacity = '1';
                captionText.style.opacity = '1';
            }, 150);

            // Optionally sync the Splide carousel position
            splideInstance.go(currentSlideIndex);
        }
    }

    document.addEventListener('keydown', function(e) {
        if(modal.classList.contains('show')) {
            if (e.key === 'ArrowLeft') {
                navigateModal(-1);
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                navigateModal(1);
                e.preventDefault();
            }
        }
    });

    // Add click handlers for navigation buttons
    prevBtn.addEventListener('click', () => navigateModal(-1));
    nextBtn.addEventListener('click', () => navigateModal(1));

    modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target === closeButton || e.target === modalImg) {
            modal.classList.remove('show');
            header.classList.remove('visible');
            document.body.style.overflow = ''; // Restore scrolling
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
            header.classList.remove('visible');
            document.body.style.overflow = ''; // Restore scrolling
        }
    });

    splide.mount();
}
