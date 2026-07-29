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

  /* ---------- Scroll reveal (staggered within groups) ---------- */
  const revealGroups = document.querySelectorAll('.feature-grid, .bento-grid, .testimonial-grid, .steps');
  revealGroups.forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      if (child.hasAttribute('data-reveal')) {
        child.style.transitionDelay = `${Math.min(i * 90, 360)}ms`;
      }
    });
  });

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

  /* ---------- Cinematic: film grain overlay ---------- */
  if (!document.querySelector('.grain-overlay')) {
    const grain = document.createElement('div');
    grain.className = 'grain-overlay';
    grain.setAttribute('aria-hidden', 'true');
    document.body.appendChild(grain);
  }

  /* ---------- Cinematic: ambient orb fields (decorative, injected so markup stays clean) ---------- */
  const orbHosts = document.querySelectorAll('[data-orb-field]');
  orbHosts.forEach((host) => {
    if (reduceMotion) return;
    const field = document.createElement('div');
    field.className = 'section-orb-field';
    field.setAttribute('aria-hidden', 'true');
    field.innerHTML = `
      <span class="ambient-orb ambient-orb--teal" style="width:340px;height:340px;top:-80px;left:-60px;"></span>
      <span class="ambient-orb ambient-orb--blue" style="width:280px;height:280px;bottom:-100px;right:-40px;animation-delay:3s;"></span>
      <span class="ambient-orb ambient-orb--amber" style="width:200px;height:200px;top:40%;right:20%;animation-delay:6s;"></span>
    `;
    host.prepend(field);
  });

  /* ---------- Cinematic: real 3D mouse-tilt for cards/images ---------- */
  if (!reduceMotion && window.matchMedia('(hover:hover)').matches) {
    const tiltEls = document.querySelectorAll('[data-tilt]');
    const maxTilt = 7; // degrees

    tiltEls.forEach((el) => {
      let raf = null;

      const onMove = (e) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * maxTilt * 2;
        const rotateX = (0.5 - py) * maxTilt * 2;

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0) scale(1.015)`;
          el.style.setProperty('--glare-x', `${(px - 0.5) * 160}%`);
          el.style.setProperty('--glare-y', `${(py - 0.5) * 160}%`);
        });
      };

      const onLeave = () => {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = '';
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    });
  }

  /* ---------- Count-up numbers (stats band + cinematic stat) ---------- */
  const countEls = document.querySelectorAll('[data-count-to]');
  if (countEls.length) {
    const animateCount = (el) => {
      const target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
      const suffix = el.getAttribute('data-suffix') || '';

      if (reduceMotion) {
        el.textContent = target.toLocaleString() + suffix;
        return;
      }

      const duration = 1400;
      const start = performance.now();

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        el.textContent = value.toLocaleString() + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target.toLocaleString() + suffix;
        }
      };
      requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      const countObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              countObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      countEls.forEach((el) => countObserver.observe(el));
    } else {
      countEls.forEach(animateCount);
    }
  }

  /* ---------- Steps connector line: draw in once the steps list is visible ---------- */
  const stepsLists = document.querySelectorAll('.steps');
  if (stepsLists.length && 'IntersectionObserver' in window) {
    const stepsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            stepsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    stepsLists.forEach((list) => stepsObserver.observe(list));
  } else {
    stepsLists.forEach((list) => list.classList.add('is-visible'));
  }

  /* ---------- Star rating: trigger twinkle-in once visible ---------- */
  const starRows = document.querySelectorAll('.star-row');
  if (starRows.length && 'IntersectionObserver' in window) {
    const starObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            starObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    starRows.forEach((row) => starObserver.observe(row));
  } else {
    starRows.forEach((row) => row.classList.add('is-visible'));
  }
});