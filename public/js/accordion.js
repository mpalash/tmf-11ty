/**
 * GSAP Accordion Component
 * A reusable accordion with smooth animations
 */

class Accordion {
    constructor(element, options = {}) {
        
        this.accordion = element;
        this.options = {
            duration: options.duration || 0.5,
            ease: options.ease || 'power2.inOut',
            openFirst: options.openFirst !== false, // true by default
            ...options
        };
                
        this.items = Array.from(this.accordion.querySelectorAll('.accordion-item'));
        this.headers = Array.from(this.accordion.querySelectorAll('.accordion-header'));
        this.contents = Array.from(this.accordion.querySelectorAll('.accordion-content'));
        
        console.log(`Found ${this.items.length} accordion items`);
        
        this.init();
    }

    init() {        
        // Set initial heights to 0 for all except first (if openFirst is true)
        this.contents.forEach((content, index) => {
            const inner = content.querySelector('.accordion-content-inner');
            const header = this.headers[index];
            const button = header.querySelector('.accordion-button');
            const isFirst = index === 0 && this.options.openFirst;
                        
            if (isFirst) {
                // Set first item open with proper classes
                gsap.set(content, { height: 'auto' });
                header.classList.add('active');
                header.setAttribute('aria-expanded', 'true');
                if (button) {
                    button.classList.add('open');
                }
            } else {
                // Close all others
                gsap.set(content, { height: 0 });
                header.classList.remove('active');
                header.setAttribute('aria-expanded', 'false');
                if (button) {
                    button.classList.remove('open');
                }
            }
        });

        // Add click handlers
        this.headers.forEach((header, index) => {
            header.addEventListener('click', (e) => {
                e.preventDefault();        
                this.toggle(index);
            });
        });
    }

    toggle(index) {
        const header = this.headers[index];
        const content = this.contents[index];
        const inner = content.querySelector('.accordion-content-inner');
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

        // Fade in content
        gsap.fromTo(inner,
            { opacity: 0, y: -20 },
            {
                opacity: 1,
                y: 0,
                duration: this.options.duration * 0.8,
                ease: this.options.ease,
                delay: this.options.duration * 0.2,
                onComplete: () => {
                }
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
            ease: this.options.ease,
            onComplete: () => {
            }
        });

        gsap.to(content, {
            height: 0,
            duration: this.options.duration,
            ease: this.options.ease,
            onStart: () => {
                content.style.overflow = 'hidden';
            },
            onComplete: () => {
            }
        });        
    }

}

// Initialize accordion when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const accordionElement = document.querySelector('.accordion');
    
    if (!accordionElement) {
        return;
    }
    
    const accordion = new Accordion(accordionElement, {
        duration: 0.5,
        ease: 'power2.inOut',
        openFirst: true
    });
});