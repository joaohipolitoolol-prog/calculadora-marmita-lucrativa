import { enterDemo } from '../lib/auth.js';

const demoButtons = document.querySelectorAll('[data-demo-enter]');

demoButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const label = btn.textContent;
    btn.disabled = true;
    btn.classList.add('loading');
    btn.textContent = 'Abrindo demo...';

    try {
      await enterDemo();
      window.location.href = '/app.html';
    } catch (error) {
      btn.disabled = false;
      btn.classList.remove('loading');
      btn.textContent = label;
      window.location.href = '/login.html?demo=1';
    }
  });
});

const sticky = document.getElementById('demo-sticky');
if (sticky) {
  const showAfter = 480;
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
    { threshold: 0.2 }
  );
  inserts.forEach((el) => observer.observe(el));
}
