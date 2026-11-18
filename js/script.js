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
        audioKnop.textContent = '⏸ Pauzeer de stem';
    });
    audio.addEventListener('pause', () => {
        audioKnop.textContent = '▶ Speel de stem af';
    });
    audio.addEventListener('ended', () => {
        audioKnop.textContent = '▶ Speel de stem af';
    });
}

const fluisterEl = document.getElementById('fluistering');
if (fluisterEl) {
    const fluisteringen = [
        'je hoort het niet… maar het hoort jou',
        'tel de klokken niet verder dan zeven',
        'het masker kijkt terug',
        'de afgrond luistert mee',
        'er is een achtste klok',
        'niet alle duisternis is kwaadaardig — en niet al het licht verdient te overleven'
    ];
    let index = Math.floor(Math.random() * fluisteringen.length);
    const toonFluistering = () => {
        fluisterEl.textContent = fluisteringen[index];
        fluisterEl.classList.add('zichtbaar');
        setTimeout(() => fluisterEl.classList.remove('zichtbaar'), 4200);
        index = (index + 1) % fluisteringen.length;
    };
    setTimeout(toonFluistering, 6000);
    setInterval(toonFluistering, 19000);
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
