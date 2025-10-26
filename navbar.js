let lastScrollTop = 0;
const navbarHeight = 70; // Approximate navbar height

window.addEventListener('DOMContentLoaded', function() {
    const navbar = document.getElementById('navbar');

    if (!navbar) {
        console.error('Navbar element not found');
        return;
    }

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDiff = currentScroll - lastScrollTop;

        if (currentScroll > lastScrollTop && currentScroll > 10) {
            // Scrolling down
            const currentTransform = parseInt(navbar.style.transform.replace('translateY(', '').replace('px)', '')) || 0;
            const newTransform = Math.max(-navbarHeight, currentTransform - scrollDiff);
            navbar.style.transform = `translateY(${newTransform}px)`;
        } else if (currentScroll < lastScrollTop) {
            // Scrolling up
            const currentTransform = parseInt(navbar.style.transform.replace('translateY(', '').replace('px)', '')) || 0;
            const newTransform = Math.min(0, currentTransform - scrollDiff);
            navbar.style.transform = `translateY(${newTransform}px)`;
        }

        // If at the very top, ensure navbar is fully visible
        if (currentScroll <= 0) {
            navbar.style.transform = 'translateY(0)';
        }

        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }, false);
});