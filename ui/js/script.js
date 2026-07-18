// ============================================================
// MedPrepAI — shared interactions
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }
 
  /* ---------- Dropdown menus (Programs / Account) ---------- */
  document.querySelectorAll('.nav-item.has-dropdown').forEach((item) => {
    const trigger = item.querySelector('.nav-link');
    if (!trigger) return;
 
    const close = () => {
      item.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    };
 
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !item.classList.contains('is-open');
      document.querySelectorAll('.nav-item.has-dropdown').forEach((other) => {
        if (other !== item) other.classList.remove('is-open');
      });
      item.classList.toggle('is-open', willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));
    });
 
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  });
 
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-item.has-dropdown.is-open').forEach((item) => {
      item.classList.remove('is-open');
      item.querySelector('.nav-link')?.setAttribute('aria-expanded', 'false');
    });
  });
 
  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.accordion-item').forEach((item) => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    if (!trigger || !panel) return;
 
    panel.style.maxHeight = '0px';
 
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
 
      item.parentElement.querySelectorAll('.accordion-item.is-open').forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          openItem.querySelector('.accordion-panel').style.maxHeight = '0px';
        }
      });
 
      if (isOpen) {
        item.classList.remove('is-open');
        panel.style.maxHeight = '0px';
      } else {
        item.classList.add('is-open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
 
  /* ---------- Exam mock countdown ring (hero signature element) ---------- */
  const timerRing = document.getElementById('timerRingFg');
  const timerText = document.getElementById('timerText');
  if (timerRing && timerText && !reduceMotion) {
    const totalSeconds = 58 * 60 + 42;
    const circumference = 2 * Math.PI * 26;
    timerRing.style.strokeDasharray = `${circumference}`;
    let remaining = totalSeconds;
 
    const tick = () => {
      remaining -= 1;
      if (remaining < 0) remaining = totalSeconds;
      const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
      const secs = String(remaining % 60).padStart(2, '0');
      timerText.textContent = `${mins}:${secs}`;
      const fraction = remaining / totalSeconds;
      timerRing.style.strokeDashoffset = String(circumference * (1 - fraction));
    };
    timerRing.style.strokeDashoffset = '0';
    setInterval(tick, 1000);
  }
 
  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && !reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }
});