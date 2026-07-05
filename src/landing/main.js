import { CHECKOUT_URL, CTA_LABEL, HERO_CTA_LABEL } from './config.js';
import { initDemo } from './demo.js';

function trackInitiateCheckout() {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', {
      value: 27,
      currency: 'BRL',
      content_name: 'Calculadora Marmita Lucrativa',
    });
  }
}

const logo = document.querySelector('.site-logo');
if (logo) {
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.querySelectorAll('[data-checkout]').forEach((link) => {
  if (!CHECKOUT_URL || CHECKOUT_URL.includes('SEU-LINK')) {
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', (e) => e.preventDefault());
    return;
  }
  link.href = CHECKOUT_URL;
  link.textContent = link.dataset.checkoutHero !== undefined ? HERO_CTA_LABEL : CTA_LABEL;
  link.setAttribute('rel', 'noopener');
  link.addEventListener('click', trackInitiateCheckout);
});

initDemo();

const demoExpandBtn = document.getElementById('demo-expand-btn');
const demoInputs = document.getElementById('demo-inputs');
if (demoExpandBtn && demoInputs) {
  demoExpandBtn.addEventListener('click', () => {
    demoInputs.classList.remove('is-collapsed');
    demoExpandBtn.hidden = true;
  });
}

const sticky = document.getElementById('purchase-sticky');
if (sticky) {
  const showAfter = 420;
  const onScroll = () => {
    sticky.classList.toggle('visible', window.scrollY > showAfter);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

const inserts = document.querySelectorAll('.insert-reveal');
if (inserts.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    },
    { threshold: 0.15 }
  );
  inserts.forEach((el) => observer.observe(el));
}
