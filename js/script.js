const navToggle = document.getElementById('nav-toggle');
const siteNav = document.getElementById('site-nav');

if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
        const open = siteNav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
}

const jaar = document.getElementById('jaar');
if (jaar) {
    jaar.textContent = new Date().getFullYear();
}

const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && reveals.length > 0) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('zichtbaar');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    reveals.forEach((el) => observer.observe(el));
} else {
    reveals.forEach((el) => el.classList.add('zichtbaar'));
}

const formulier = document.getElementById('contact-formulier');
const melding = document.getElementById('formulier-melding');
if (formulier && melding) {
    formulier.addEventListener('submit', (event) => {
        event.preventDefault();
        melding.hidden = false;
        formulier.reset();
    });
}
