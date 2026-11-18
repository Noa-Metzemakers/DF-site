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

const lagen = document.querySelectorAll('.achtergrond-laag');
if (lagen.length > 1) {
    let huidige = 0;
    setInterval(() => {
        lagen[huidige].classList.remove('actief');
        huidige = (huidige + 1) % lagen.length;
        lagen[huidige].classList.add('actief');
    }, 8000);
}

const audio = document.getElementById('audio');
const audioKnop = document.getElementById('audio-knop');
if (audio && audioKnop) {
    audioKnop.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    });
    audio.addEventListener('play', () => {
        audioKnop.textContent = '⏸ Pauzeer VERT_DF2';
    });
    audio.addEventListener('pause', () => {
        audioKnop.textContent = '▶ Speel VERT_DF2 af';
    });
    audio.addEventListener('ended', () => {
        audioKnop.textContent = '▶ Speel VERT_DF2 af';
    });
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
