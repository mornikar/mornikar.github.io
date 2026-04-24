document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const animateElements = entry.target.querySelectorAll('[data-animate]');
                animateElements.forEach((el, index) => {
                    setTimeout(() => {
                        el.classList.add('animate');
                    }, index * 200);
                });
            }
        });
    }, observerOptions);

    document.querySelectorAll('.scene').forEach(scene => {
        observer.observe(scene);
    });

    const firstScene = document.querySelector('#scene1');
    if (firstScene) {
        const animateElements = firstScene.querySelectorAll('[data-animate]');
        animateElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('animate');
            }, index * 300);
        });
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    });

    function updateParallax() {
        const scrolled = window.pageYOffset;
        document.querySelectorAll('.scene').forEach((scene, index) => {
            const speed = 0.5;
            const yPos = -(scrolled * speed * 0.1);
            scene.style.transform = `translateY(${yPos}px)`;
        });
    }

    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});