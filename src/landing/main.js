import {
  CHECKOUT_URL,
  CTA_LABEL,
  HERO_CTA_LABEL,
  MAIN_PRICE,
  MAIN_PRICE_LABEL,
} from './config.js';
import { initDemo } from './demo.js';

function trackInitiateCheckout() {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', {
      value: MAIN_PRICE,
      currency: 'USD',
      content_name: 'Kit Paletas de WhatsApp',
    });
  }
}

document.querySelectorAll('[data-price]').forEach((el) => {
  el.textContent = MAIN_PRICE_LABEL;
});

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
  if (link.dataset.checkoutHero !== undefined) {
    link.textContent = HERO_CTA_LABEL;
  } else if (!link.dataset.checkoutCustom) {
    link.textContent = CTA_LABEL;
  }
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
if (inserts.length) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    inserts.forEach((el) => observer.observe(el));
  } else {
    inserts.forEach((el) => el.classList.add('visible'));
  }
}

document.querySelectorAll('.faq-item').forEach((item) => {
  const trigger = item.querySelector('.faq-question');
  if (!trigger) return;
  trigger.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');
    document.querySelectorAll('.faq-item.is-open').forEach((open) => {
      open.classList.remove('is-open');
      open.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
});
