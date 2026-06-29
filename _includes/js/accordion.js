/* GSAP Accordion — a reusable accordion with smooth animations.
 * Imported by content/events.njk via `import { Accordion } from '/js/accordion.js'`.
 * Depends on the global `gsap` (loaded from CDN before the page module runs). */

const PRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Accordion {
    constructor(element, options = {}) {
        this.accordion = element;
        this.options = {
            duration: options.duration || 0.5,
            ease: options.ease || 'power2.inOut',
            openFirst: options.openFirst !== false, // true by default
            ...options
        };
        // Reduced motion: collapse/expand instantly (no height/opacity tween).
        if (PRM) this.options.duration = 0;

        this.items = Array.from(this.accordion.querySelectorAll('.accordion-item'));
        this.headers = Array.from(this.accordion.querySelectorAll('.accordion-header'));
        this.contents = Array.from(this.accordion.querySelectorAll('.accordion-content'));

        this.init();
    }

    init() {
        // Set initial heights to 0 for all except first (if openFirst is true)
        this.contents.forEach((content, index) => {
            const header = this.headers[index];
            const button = header.querySelector('.accordion-button');
            const isFirst = index === 0 && this.options.openFirst;

            if (isFirst) {
                gsap.set(content, { height: 'auto' });
                header.classList.add('active');
                header.setAttribute('aria-expanded', 'true');
                if (button) {
                    button.classList.add('open');
                }
            } else {
                gsap.set(content, { height: 0 });
                header.classList.remove('active');
                header.setAttribute('aria-expanded', 'false');
                if (button) {
                    button.classList.remove('open');
                }
            }
        });

        this.headers.forEach((header, index) => {
            header.addEventListener('click', () => {
                this.toggle(index);
            });
        });
    }

    toggle(index) {
        const header = this.headers[index];
        const isActive = header.classList.contains('active');

        if (isActive) {
            this.close(index);
        } else {
            this.headers.forEach((h, i) => {
                if (h.classList.contains('active')) {
                    this.close(i);
                }
            });
            this.open(index);
        }
    }

    open(index) {
        const header = this.headers[index];
        const content = this.contents[index];
        const inner = content.querySelector('.accordion-content-inner');
        const button = header.querySelector('.accordion-button');

        header.classList.add('active');
        header.setAttribute('aria-expanded', 'true');

        if (button) {
            button.classList.add('open');
        }

        gsap.fromTo(content,
            { height: 0 },
            {
                height: 'auto',
                duration: this.options.duration,
                ease: this.options.ease,
                onStart: () => {
                    content.style.overflow = 'hidden';
                },
                onComplete: () => {
                    content.style.overflow = 'visible';
                }
            }
        );

        gsap.fromTo(inner,
            { opacity: 0, y: -20 },
            {
                opacity: 1,
                y: 0,
                duration: this.options.duration * 0.8,
                ease: this.options.ease,
                delay: this.options.duration * 0.2
            }
        );
    }

    close(index) {
        const header = this.headers[index];
        const content = this.contents[index];
        const inner = content.querySelector('.accordion-content-inner');
        const button = header.querySelector('.accordion-button');

        header.classList.remove('active');
        header.setAttribute('aria-expanded', 'false');

        if (button) {
            button.classList.remove('open');
        }

        gsap.to(inner, {
            opacity: 0,
            y: -10,
            duration: this.options.duration * 0.5,
            ease: this.options.ease
        });

        gsap.to(content, {
            height: 0,
            duration: this.options.duration,
            ease: this.options.ease,
            onStart: () => {
                content.style.overflow = 'hidden';
            }
        });
    }
}
