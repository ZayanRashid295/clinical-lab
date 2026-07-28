/** Scoped clinical program-page styles (ported from ui/css/style.css). */
export const PROGRAM_UI_CSS = `
/* ============================================================
   MedPrepAI — Design tokens
   A clinical-exam aesthetic: chart-navy, ECG-teal, mono data type.
   ============================================================ */
.program-ui{
  --navy-950:#071626;
  --navy-900:#0b2338;
  --navy-800:#123252;
  --blue-600:#1c6fc9;
  --blue-500:#2f86e6;
  --teal-600:#0b8f8a;
  --teal-300:#8fd4cf;
  --amber-500:#e5a13a;
  --bg:#f5f8fa;
  --surface:#ffffff;
  --ink-900:#0e1b2b;
  --ink-700:#33465c;
  --ink-500:#5c7086;
  --line:#dde5ec;
  --line-strong:#c3d1dd;
  --radius-sm:6px;
  --radius-md:12px;
  --radius-lg:20px;
  --shadow-card:0 1px 2px rgba(11,35,56,.04), 0 8px 24px -12px rgba(11,35,56,.12);
  --shadow-pop:0 20px 45px -20px rgba(7,22,38,.35);
  --font-display:'Manrope', 'Segoe UI', sans-serif;
  --font-body:'Source Sans 3', 'Segoe UI', sans-serif;
  --font-mono:'IBM Plex Mono', ui-monospace, monospace;
  --mkt-accent:var(--blue-600);
  --mkt-accent-hover:var(--blue-500);
  --mkt-border:var(--line);
  --mkt-bg:var(--surface);
  --mkt-bg-elevated:var(--bg);
  --mkt-text:var(--ink-900);
  --mkt-text-muted:var(--ink-500);
  min-height:100vh;
}
 
*,*::before,*::after{box-sizing:border-box}

@media (prefers-reduced-motion: reduce){
.program-ui html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important;scroll-behavior:auto !important}
}
.program-ui{
  margin:0;
  font-family:var(--font-body);
  color:var(--ink-900);
  background:var(--bg);
  -webkit-font-smoothing:antialiased;
  line-height:1.55;
}
.program-ui h1, .program-ui h2, .program-ui h3, .program-ui h4{
  font-family:var(--font-display);
  color:var(--navy-950);
  margin:0 0 .5em;
  line-height:1.15;
  letter-spacing:-.01em;
}
.program-ui p{margin:0 0 1em}
.program-ui a{color:inherit;text-decoration:none}
.program-ui ul, .program-ui ol{margin:0;padding:0;list-style:none}
.program-ui img{max-width:100%;display:block}
.program-ui button{font:inherit;background:none;border:none;cursor:pointer;color:inherit}
:focus-visible{outline:3px solid var(--blue-500);outline-offset:2px}
 
.program-ui .container{max-width:1180px;margin-inline:auto;padding-inline:24px}
.program-ui .container--narrow{max-width:820px}
 
.program-ui .eyebrow{
  font-family:var(--font-mono);
  font-size:.78rem;
  font-weight:600;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:var(--blue-600);
  margin:0 0 .75em;
  display:flex;
  align-items:center;
  gap:.5em;
}
.program-ui .eyebrow::before{
  content:"";
  width:18px;height:2px;
  background:var(--amber-500);
  display:inline-block;
}
.program-ui .eyebrow--teal{color:var(--teal-600)}
.program-ui .eyebrow--teal::before{background:var(--teal-600)}
.program-ui .eyebrow--light{color:var(--teal-300)}
.program-ui .eyebrow--light::before{background:var(--teal-300)}
 
.program-ui .section{padding:96px 0}
.program-ui .section--muted{background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.program-ui .section-lede{max-width:640px;color:var(--ink-700);font-size:1.05rem}
 
/* Buttons */
.program-ui .btn{
  display:inline-flex;align-items:center;justify-content:center;gap:.5em;
  padding:.85em 1.5em;
  border-radius:999px;
  font-weight:600;
  font-size:.95rem;
  transition:transform .15s ease, box-shadow .15s ease, background .15s ease, color .15s ease;
  white-space:nowrap;
}
.program-ui .btn-primary{background:var(--blue-600);color:#fff;box-shadow:var(--shadow-pop)}
.program-ui .btn-primary:hover{background:var(--blue-500);transform:translateY(-1px)}
.program-ui .btn-ghost{color:var(--navy-900);border:1.5px solid var(--line-strong);background:var(--surface)}
.program-ui .btn-ghost:hover{border-color:var(--blue-600);color:var(--blue-600)}
.program-ui .btn-light{background:#fff;color:var(--navy-900)}
.program-ui .btn-light:hover{background:var(--teal-300)}
.program-ui .btn-ghost-light{color:#fff;border:1.5px solid rgba(255,255,255,.4)}
.program-ui .btn-ghost-light:hover{border-color:#fff}
.program-ui .btn-outline{border:1.5px solid var(--teal-600);color:var(--teal-600);padding:.7em 1.3em}
.program-ui .btn-outline:hover{background:var(--teal-600);color:#fff}
.program-ui .btn-sm{padding:.6em 1.2em;font-size:.85rem}
 
/* ============ Header ============ */
.program-ui .site-header{
  position:sticky;top:0;z-index:50;
  background:rgba(245,248,250,.85);
  backdrop-filter:blur(10px);
  border-bottom:1px solid var(--line);
}
.program-ui .nav-inner{
  display:flex;align-items:center;gap:28px;
  height:72px;
}
.program-ui .brand{
  display:flex;align-items:center;gap:.55em;
  font-family:var(--font-display);
  font-weight:800;
  font-size:1.15rem;
  color:var(--navy-950);
  margin-right:auto;
  letter-spacing:-0.02em;
}
.program-ui .brand-name{
  font-family:var(--font-display);
  font-weight:800;
  font-size:1.15rem;
  color:var(--navy-950);
  letter-spacing:-0.02em;
  line-height:1;
}
.program-ui .brand-logo{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  flex:none;
  background:var(--navy-800);
  overflow:hidden;
}
.program-ui .brand-logo img{
  width:62%;
  height:62%;
  object-fit:contain;
  display:block;
}
.program-ui .brand svg{flex:none}
.program-ui .dropdown-action{
  display:block;
  width:100%;
  text-align:left;
  padding:.6em .8em;
  border-radius:6px;
  font-size:.92rem;
  color:var(--ink-700);
  background:none;
  border:none;
  cursor:pointer;
  font-family:inherit;
}
.program-ui .dropdown-action:hover{background:var(--bg);color:var(--blue-600)}
.program-ui .main-nav{display:flex;align-items:center;gap:6px;margin-right:auto}
.program-ui .nav-item{position:relative}
.program-ui .nav-link{
  display:flex;align-items:center;gap:.35em;
  padding:.6em .9em;
  border-radius:8px;
  font-weight:600;
  font-size:.95rem;
  color:var(--ink-700);
}
.program-ui .nav-link:hover, .program-ui .nav-item.is-open .nav-link{color:var(--navy-950);background:rgba(28,111,201,.08)}
.program-ui .nav-link .chev{transition:transform .15s ease}
.program-ui .nav-item.is-open .chev{transform:rotate(180deg)}
.program-ui .dropdown{
  position:absolute;top:100%;left:0;
  min-width:190px;
  padding:10px 0 0;
  background:transparent;
  border:none;
  box-shadow:none;
  opacity:0;visibility:hidden;
  transition:opacity .15s ease, visibility .15s ease;
  z-index:60;
}
.program-ui .nav-item.is-open .dropdown{opacity:1;visibility:visible}
.program-ui .dropdown-panel{
  background:var(--surface);
  border:1px solid var(--line);
  border-radius:var(--radius-md);
  box-shadow:var(--shadow-card);
  padding:6px;
}
.program-ui .dropdown a,
.program-ui .dropdown .dropdown-action{
  display:block;width:100%;padding:.65em .85em;border-radius:6px;font-size:.92rem;font-weight:600;color:var(--ink-900);text-align:left
}
.program-ui .dropdown a:hover,
.program-ui .dropdown .dropdown-action:hover{background:var(--bg);color:var(--blue-600)}
.program-ui .nav-toggle{display:none;padding:8px}
.program-ui .nav-toggle span{display:block;width:22px;height:2px;background:var(--navy-950);margin:5px 0;transition:transform .2s ease, opacity .2s ease}
 
@media (max-width:860px){
.program-ui .main-nav{
    position:fixed;inset:72px 0 0 0;
    background:var(--surface);
    flex-direction:column;align-items:stretch;
    padding:16px;gap:2px;
    transform:translateX(100%);
    transition:transform .25s ease;
    overflow-y:auto;
  }
.program-ui .main-nav.is-open{transform:translateX(0)}
.program-ui .dropdown{position:static;box-shadow:none;border:none;opacity:1;visibility:visible;transform:none;display:none;padding:0 0 0 12px;background:transparent}
.program-ui .nav-item.is-open .dropdown{display:block}
.program-ui .dropdown-panel{box-shadow:none;border:none;background:transparent;padding:0}
.program-ui .nav-cta{display:none}
.program-ui .nav-toggle{display:block}
}
 
/* ============ Hero (photo banner) ============ */
.program-ui .hero-banner{
  position:relative;
  min-height:640px;
  display:flex;align-items:center;
  overflow:hidden;
  background:var(--navy-950);
}
.program-ui .hero-banner-img{
  position:absolute;inset:0;
  width:100%;height:100%;
  object-fit:cover;object-position:center 20%;
}
.program-ui .hero-banner-scrim{
  position:absolute;inset:0;
  background:
    linear-gradient(100deg, rgba(7,22,38,.94) 0%, rgba(7,22,38,.82) 32%, rgba(7,22,38,.45) 60%, rgba(7,22,38,.2) 100%),
    linear-gradient(0deg, rgba(7,22,38,.55), transparent 40%);
}
.program-ui .hero-banner-inner{
  position:relative;z-index:1;
  padding-block:120px 96px;
  max-width:680px;
  margin-inline:0;
  text-align:left;
}
.program-ui .hero-banner-h1{
  font-size:clamp(2.4rem,4.5vw,3.4rem);
  color:#fff;
}
.program-ui .hero-banner-h1 span{color:var(--teal-300)}
.program-ui .hero-banner-lede{
  font-size:1.22rem;line-height:1.6;color:#dbe6ef;max-width:58ch;margin-bottom:1.5rem;
}
.program-ui .hero-actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
 
@media (max-width:760px){
.program-ui .hero-banner{min-height:auto}
.program-ui .hero-banner-inner{padding-block:88px 64px}
.program-ui .hero-banner-scrim{
    background:
      linear-gradient(180deg, rgba(7,22,38,.55) 0%, rgba(7,22,38,.88) 55%, rgba(7,22,38,.96) 100%);
  }
}
 
/* Exam mockup — signature element */
.program-ui .exam-mock{
  background:var(--navy-950);
  border-radius:var(--radius-lg);
  padding:22px;
  box-shadow:var(--shadow-pop);
  color:#eaf1f7;
  position:relative;
  overflow:hidden;
}
.program-ui .exam-mock::before{
  content:"";position:absolute;inset:0;
  background:radial-gradient(600px 260px at 100% 0%, rgba(28,111,201,.28), transparent 60%);
  pointer-events:none;
}
.program-ui .exam-mock-bar{
  display:flex;align-items:center;justify-content:space-between;
  font-family:var(--font-mono);font-size:.78rem;
  color:var(--teal-300);
  padding-bottom:14px;margin-bottom:16px;
  border-bottom:1px solid rgba(255,255,255,.12);
}
.program-ui .exam-timer{display:flex;align-items:center;gap:.5em;color:#fff}
.program-ui .exam-timer svg circle.ring-bg{stroke:rgba(255,255,255,.15)}
.program-ui .exam-timer svg circle.ring-fg{stroke:var(--amber-500);stroke-linecap:round;transform:rotate(-90deg);transform-origin:50% 50%}
.program-ui .exam-mock-q{
  font-size:.98rem;line-height:1.6;color:#f3f7fb;
  margin-bottom:16px;
}
.program-ui .exam-mock-options{display:flex;flex-direction:column;gap:8px;position:relative}
.program-ui .exam-mock-options li{
  display:flex;align-items:flex-start;gap:10px;
  padding:11px 14px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,.14);
  font-size:.9rem;
  color:#d7e2ec;
  position:relative;
}
.program-ui .opt-letter{
  font-family:var(--font-mono);font-weight:600;font-size:.8rem;
  width:20px;height:20px;border-radius:6px;
  background:rgba(255,255,255,.08);
  display:flex;align-items:center;justify-content:center;flex:none;
  margin-top:1px;
}
.program-ui .exam-mock-options li.is-correct{
  border-color:rgba(143,212,207,.55);
  background:rgba(14,149,148,.16);
  flex-wrap:wrap;
}
.program-ui .exam-mock-options li.is-correct .opt-letter{background:var(--teal-600);color:#fff}
.program-ui .opt-check{margin-left:auto;color:var(--teal-300);font-weight:700}
.program-ui .opt-explain{
  flex-basis:100%;
  margin-top:8px;padding-top:8px;
  border-top:1px dashed rgba(255,255,255,.18);
  font-size:.82rem;color:var(--teal-300);
  line-height:1.5;
}
 
/* ============ Stats band ============ */
.program-ui .stats-band{background:var(--navy-950);color:#fff;padding:44px 0}
.program-ui .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.program-ui .stat{
  padding-inline:20px;
  border-left:1px solid rgba(255,255,255,.14);
}
.program-ui .stat:first-child{border-left:none;padding-left:0}
.program-ui .stat-num{
  display:block;font-family:var(--font-mono);font-weight:600;
  font-size:1.9rem;color:var(--teal-300);letter-spacing:-.01em;
}
.program-ui .stat-label{display:block;margin-top:6px;font-size:.85rem;color:#c4d2de;line-height:1.4}
 
/* ============ Feature cards ============ */
.program-ui .subsection-head{margin-top:56px;padding-top:40px;border-top:1px solid var(--line)}
.program-ui .subsection-head h3{font-size:1.5rem}
 
.program-ui .feature-grid{
  margin-top:32px;
  display:grid;grid-template-columns:repeat(3,1fr);gap:22px;
}
.program-ui .feature-card{
  background:var(--surface);
  border:1px solid var(--line);
  border-radius:var(--radius-md);
  padding:26px;
  box-shadow:var(--shadow-card);
}
.program-ui .feature-icon{
  width:44px;height:44px;border-radius:10px;
  background:linear-gradient(135deg, var(--blue-600), var(--teal-600));
  display:flex;align-items:center;justify-content:center;
  color:#fff;margin-bottom:18px;
  overflow:hidden;
}
.program-ui .feature-icon img{width:100%;height:100%;object-fit:cover;border-radius:10px}
.program-ui .feature-card h4{font-size:1.08rem;margin-bottom:.4em}
.program-ui .feature-card p{color:var(--ink-700);font-size:.94rem;margin:0}
 
/* ============ Bento grid ============ */
.program-ui .bento-grid{
  margin-top:32px;
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:20px;
}
.program-ui .bento-card{
  background:var(--surface);
  border:1px solid var(--line);
  border-radius:var(--radius-md);
  padding:28px;
  display:flex;flex-direction:column;
  min-height:200px;
  transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.program-ui .bento-card:hover{
  transform:translateY(-3px);
  box-shadow:var(--shadow-card);
  border-color:var(--line-strong);
}
.program-ui .bento-card--lg{
  grid-column:span 2;grid-row:span 1;
  background:var(--navy-950);color:#fff;
  justify-content:center;
  position:relative;overflow:hidden;
}
.program-ui .bento-card--lg::before{
  content:"";position:absolute;inset:0;
  background:radial-gradient(420px 220px at 100% 0%, rgba(28,111,201,.35), transparent 65%);
  pointer-events:none;
}
.program-ui .bento-card--lg:hover{transform:none;border-color:var(--line)}
.program-ui .bento-card--lg .bento-icon{
  width:46px;height:46px;border-radius:12px;
  background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.14);
  display:flex;align-items:center;justify-content:center;
  margin-bottom:16px;position:relative;
}
.program-ui .bento-card--lg .bento-num{font-family:var(--font-mono);font-size:2.4rem;color:var(--teal-300);font-weight:600;line-height:1;position:relative}
.program-ui .bento-card--lg h4{color:#fff;margin-top:.45em;font-size:1.15rem;position:relative}
.program-ui .bento-card--lg p{color:#c4d2de;font-size:.94rem;margin:0;max-width:40ch;position:relative}
.program-ui .bento-card .feature-icon{
  width:46px;height:46px;border-radius:12px;
  margin-bottom:16px;
  box-shadow:0 6px 16px -8px rgba(28,111,201,.55);
}
.program-ui .bento-card h4{font-size:1.05rem;margin-bottom:.45em;color:var(--navy-950)}
.program-ui .bento-card p{color:var(--ink-700);font-size:.92rem;margin:0;line-height:1.55}

/* Circular icon badge — used for the refreshed bento cards */
.program-ui .icon-badge{
  width:42px;height:42px;border-radius:50%;flex:none;
  background:rgba(11,143,138,.1);
  border:1px solid rgba(11,143,138,.25);
  display:flex;align-items:center;justify-content:center;
  color:var(--teal-600);
  margin-bottom:16px;
  transition:background .18s ease, color .18s ease, border-color .18s ease;
}
.program-ui .bento-card:hover .icon-badge{background:var(--teal-600);color:#fff;border-color:var(--teal-600)}
.program-ui .bento-card--lg .icon-badge{
  background:rgba(255,255,255,.08);
  border-color:rgba(255,255,255,.18);
  color:var(--teal-300);
}
.program-ui .bento-card--lg:hover .icon-badge{background:rgba(255,255,255,.08);color:var(--teal-300);border-color:rgba(255,255,255,.18)}
.program-ui .bento-tag{
  font-family:var(--font-mono);font-size:.72rem;font-weight:600;
  letter-spacing:.06em;text-transform:uppercase;
  color:var(--teal-600);margin-bottom:8px;display:block;
}
.program-ui .bento-card--lg .bento-tag{color:var(--teal-300)}
 
@media (max-width:900px){
.program-ui .bento-grid{grid-template-columns:repeat(2,1fr)}
.program-ui .bento-card--lg{grid-column:span 2}
}
@media (max-width:560px){
.program-ui .bento-grid{grid-template-columns:1fr}
.program-ui .bento-card--lg{grid-column:span 1}
}
 
/* ============ Included panel (checklist) ============ */
.program-ui .included-panel{
  margin-top:32px;
  background:var(--navy-950);
  border-radius:var(--radius-lg);
  padding:40px;
  box-shadow:var(--shadow-pop);
  position:relative;overflow:hidden;
}
.program-ui .included-panel::before{
  content:"";position:absolute;inset:0;
  background:radial-gradient(640px 300px at 100% 0%, rgba(28,111,201,.28), transparent 60%);
  pointer-events:none;
}
.program-ui .included-panel-head{
  position:relative;
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;
  padding-bottom:24px;margin-bottom:28px;
  border-bottom:1px solid rgba(255,255,255,.12);
}
.program-ui .included-tag{
  font-family:var(--font-mono);font-size:.78rem;font-weight:600;
  letter-spacing:.08em;text-transform:uppercase;color:var(--teal-300);
}
.program-ui .included-count{font-family:var(--font-mono);font-weight:600;font-size:1.3rem;color:#fff}
.program-ui .included-list{
  position:relative;
  display:grid;grid-template-columns:repeat(2,1fr);gap:28px 44px;
  list-style:none;margin:0;padding:0;
}
.program-ui .included-list li{display:flex;align-items:flex-start;gap:14px}
.program-ui .included-check{
  width:28px;height:28px;border-radius:50%;flex:none;margin-top:2px;
  background:rgba(143,212,207,.12);
  border:1px solid rgba(143,212,207,.35);
  color:var(--teal-300);
  display:flex;align-items:center;justify-content:center;
}
.program-ui .included-list h4{color:#fff;font-size:1rem;margin-bottom:.3em}
.program-ui .included-list p{color:#c4d2de;font-size:.88rem;margin:0;line-height:1.55}
@media (max-width:700px){
.program-ui .included-panel{padding:28px 24px}
.program-ui .included-list{grid-template-columns:1fr}
}

/* Meta strip for the "Built Into Every Question" card grid (light variant of included-panel-head) */
.program-ui .included-meta{
  margin-top:32px;
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;
  padding-bottom:16px;
  border-bottom:1px solid var(--line);
}
.program-ui .included-meta .included-tag{color:var(--teal-600)}
.program-ui .included-meta .included-count{color:var(--navy-950)}
 
/* ============ Steps ============ */
.program-ui .steps{
  margin-top:36px;
  display:grid;grid-template-columns:repeat(4,1fr);
  gap:0;
  position:relative;
}
.program-ui .steps::before{
  content:"";position:absolute;top:22px;left:6%;right:6%;height:1px;
  background:repeating-linear-gradient(to right, var(--line-strong) 0 8px, transparent 8px 14px);
}
.program-ui .step{position:relative;padding:0 18px 0 0}
.program-ui .step-num{
  display:inline-flex;align-items:center;justify-content:center;
  width:44px;height:44px;border-radius:50%;
  background:var(--surface);
  border:1.5px solid var(--blue-600);
  color:var(--blue-600);
  font-family:var(--font-mono);font-weight:600;
  margin-bottom:18px;position:relative;z-index:1;
}
.program-ui .step h4{font-size:1.02rem}
.program-ui .step p{color:var(--ink-700);font-size:.9rem}
 
@media (max-width:860px){
.program-ui .steps{grid-template-columns:1fr;gap:28px}
.program-ui .steps::before{display:none}
}
 
/* ============ Testimonials ============ */
.program-ui .testimonial-grid{margin-top:32px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.program-ui .testimonial{
  margin:0;background:var(--bg);
  border:1px solid var(--line);
  border-radius:var(--radius-md);
  padding:26px;
}
.program-ui .testimonial p{
  font-size:1rem;color:var(--navy-950);
  position:relative;padding-left:22px;
}
.program-ui .testimonial p::before{
  content:"";position:absolute;left:0;top:.35em;
  width:12px;height:12px;
  border-left:2px solid var(--teal-600);
  border-bottom:2px solid var(--teal-600);
}
.program-ui .testimonial footer{display:flex;align-items:center;gap:12px;margin-top:16px;font-size:.88rem;color:var(--ink-500)}
.program-ui .avatar{
  width:36px;height:36px;border-radius:50%;
  background:var(--navy-900);color:var(--teal-300);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--font-mono);font-weight:600;font-size:.8rem;flex:none;
}
 
/* ============ CTA band ============ */
.program-ui .cta-band{
  color:#fff;padding:96px 0;text-align:center;position:relative;overflow:hidden;
  background:
    radial-gradient(ellipse 75% 60% at 50% -15%, rgba(47,134,230,.42), transparent 58%),
    radial-gradient(ellipse 45% 40% at 85% 110%, rgba(11,143,138,.28), transparent 55%),
    radial-gradient(ellipse 40% 35% at 8% 95%, rgba(28,111,201,.22), transparent 50%),
    linear-gradient(168deg, #0c2744 0%, #071626 48%, #0a2238 100%);
}
.program-ui .cta-band::before{
  content:"";position:absolute;left:50%;bottom:-30%;
  width:min(560px,90vw);height:560px;transform:translateX(-50%);
  background:radial-gradient(circle, rgba(47,134,230,.28), transparent 68%);
  pointer-events:none;
}
.program-ui .cta-band::after{
  content:"";position:absolute;inset:0;
  background:repeating-linear-gradient(0deg, rgba(255,255,255,.045) 0 1px, transparent 1px 48px);
  opacity:.35;pointer-events:none;mask-image:linear-gradient(180deg, transparent, #000 20%, #000 80%, transparent);
}
.program-ui .cta-inner{position:relative;z-index:1;max-width:680px}
.program-ui .cta-band .eyebrow--light{color:#9ee4df;justify-content:center}
.program-ui .cta-band .eyebrow--light::before{background:var(--amber-500)}
.program-ui .cta-band h2{
  color:#fff;font-size:clamp(2rem,4.2vw,2.85rem);letter-spacing:-.02em;margin-bottom:.35em;
  text-shadow:0 0 48px rgba(47,134,230,.28);
}
.program-ui .cta-band .cta-lead{color:#dceaf5;font-size:1.12rem;margin-bottom:28px}
.program-ui .cta-band .pill-row{margin-bottom:32px}
.program-ui .cta-band .pill{
  background:rgba(255,255,255,.08);
  border:1px solid rgba(143,212,207,.4);
  color:#eef8f7;
  backdrop-filter:blur(8px);
  box-shadow:0 0 0 1px rgba(255,255,255,.04) inset;
}
.program-ui .cta-band .hero-actions{justify-content:center;gap:12px}
.program-ui .cta-band .btn-primary{
  box-shadow:0 0 0 1px rgba(255,255,255,.12) inset, 0 14px 40px -10px rgba(28,111,201,.75);
}
.program-ui .cta-band .btn-primary:hover{
  box-shadow:0 0 0 1px rgba(255,255,255,.16) inset, 0 18px 48px -8px rgba(47,134,230,.85);
}
.program-ui .cta-band .btn-ghost-light{
  border-color:rgba(255,255,255,.55);
  background:rgba(255,255,255,.07);
  backdrop-filter:blur(6px);
}
.program-ui .cta-band .btn-ghost-light:hover{
  border-color:#fff;background:rgba(255,255,255,.14);color:#fff;
}
 
/* ============ FAQ / Accordion ============ */
.program-ui .accordion{margin-top:28px;border-top:1px solid var(--line)}
.program-ui .accordion-item{border-bottom:1px solid var(--line)}
.program-ui .accordion-trigger{
  width:100%;display:flex;align-items:center;justify-content:space-between;
  padding:20px 4px;text-align:left;
  font-family:var(--font-display);font-weight:700;font-size:1.02rem;
  color:var(--navy-950);
}
.program-ui .accordion-icon{
  font-family:var(--font-mono);color:var(--blue-600);font-size:1.2rem;
  transition:transform .2s ease;flex:none;margin-left:16px;
}
.program-ui .accordion-item.is-open .accordion-icon{transform:rotate(45deg)}
.program-ui .accordion-panel{
  max-height:0;overflow:hidden;
  transition:max-height .25s ease;
}
.program-ui .accordion-panel p{padding:0 4px 20px;color:var(--ink-700);max-width:70ch}
 
/* ============ Footer ============ */
.program-ui .site-footer{background:var(--navy-950);color:#c4d2de;padding-top:56px}
.program-ui .footer-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:32px;padding-bottom:40px}
.program-ui .footer-brand .brand{
  color:#fff;
  margin-bottom:12px;
  display:inline-flex;
  align-items:center;
  gap:.55em;
}
.program-ui .footer-brand .brand-name{color:#fff}
.program-ui .footer-brand .brand-logo{background:var(--navy-800)}
.program-ui .footer-brand p{color:#94a8ba;font-size:.92rem;max-width:36ch}
.program-ui .footer-col h5{font-family:var(--font-mono);text-transform:uppercase;font-size:.78rem;letter-spacing:.08em;color:var(--teal-300);margin-bottom:14px}
.program-ui .footer-col li{margin-bottom:9px}
.program-ui .footer-col a{font-size:.92rem;color:#c4d2de}
.program-ui .footer-col a:hover{color:#fff}
.program-ui .footer-bottom{border-top:1px solid rgba(255,255,255,.12);padding:20px 24px;font-size:.82rem;color:#7f93a6}
 
/* ============ Home hero (two-column, no photo) ============ */
.program-ui .home-hero{padding:64px 0 0}
.program-ui .home-hero-grid{
  display:grid;grid-template-columns:1.05fr 1fr;gap:56px;
  align-items:center;padding-bottom:64px;
}
.program-ui .home-hero h1{font-size:clamp(2.3rem,4.3vw,3.2rem)}
.program-ui .home-hero-sub{font-family:var(--font-display);font-weight:600;font-size:1.15rem;color:var(--ink-700);margin-bottom:18px}
.program-ui .pill-row{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:26px}
.program-ui .pill{
  display:inline-flex;align-items:center;gap:6px;
  padding:.45em .95em;border-radius:999px;
  border:1px solid var(--line-strong);
  background:var(--surface);
  font-size:.82rem;font-weight:600;color:var(--navy-900);
}
.program-ui .pill svg{color:var(--teal-600);flex:none}
.program-ui .pill-row--center{justify-content:center}
.program-ui .hero-fineprint{margin-top:10px;font-size:.85rem;color:var(--ink-500)}
 
/* ============ Trust stat + star ratings ============ */
.program-ui .trust-stat{max-width:640px;margin:8px auto 44px;text-align:center}
.program-ui .star-row{color:var(--amber-500);font-size:1.3rem;letter-spacing:.15em;margin-bottom:12px}
.program-ui .trust-stat .mission-statement{font-size:clamp(1.2rem,2.2vw,1.5rem)}
.program-ui .testimonial .stars{display:block;color:var(--amber-500);font-size:.8rem;letter-spacing:.2em;margin-bottom:10px}
 
/* Product mockup card used in home hero */
.program-ui .platform-mock{
  background:var(--navy-950);border-radius:var(--radius-lg);
  padding:20px;box-shadow:var(--shadow-pop);color:#eaf1f7;
  display:flex;flex-direction:column;gap:16px;
}
.program-ui .mock-panel{
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.1);
  border-radius:var(--radius-md);
  padding:16px;
}
.program-ui .mock-panel-label{
  font-family:var(--font-mono);font-size:.72rem;color:var(--teal-300);
  text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;display:block;
}
 
/* ============ Mission statement ============ */
.program-ui .mission{padding:80px 0;text-align:center}
.program-ui .mission-inner{max-width:760px;margin-inline:auto}
.program-ui .mission-statement{
  font-family:var(--font-display);font-weight:700;
  font-size:clamp(1.5rem,3vw,2.1rem);
  color:var(--navy-950);line-height:1.35;
}
 
/* ============ Bento full-width card ============ */
.program-ui .bento-card--full{grid-column:1 / -1}
.program-ui .bento-card--full{
  display:flex;align-items:center;justify-content:space-between;gap:24px;
  flex-wrap:wrap;background:var(--surface);border:1px solid var(--line);
}
.program-ui .bento-card--full h4{margin-bottom:.25em}
.program-ui .bento-card--full p{margin:0;max-width:52ch}
 
/* ============ Five-up feature grid ============ */
.program-ui .feature-grid--five{
  margin-top:32px;display:grid;
  grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:20px;
}
 
/* ============ Alternating feature rows ============ */
.program-ui .feature-row{
  display:grid;grid-template-columns:1fr 1fr;gap:56px;
  align-items:center;padding:48px 0;
}
.program-ui .section-lede + .feature-row{margin-top:16px}
.program-ui .feature-row + .feature-row{border-top:1px solid var(--line)}
.program-ui .feature-row.reverse .feature-row-media{order:2}
.program-ui .feature-row-text h3{font-size:1.6rem}
.program-ui .feature-row-text p{color:var(--ink-700);font-size:1.02rem;max-width:48ch}
 
/* Mini MCQ visual (reuses exam-mock look at smaller scale) */
.program-ui .mini-mcq{background:var(--navy-950);border-radius:var(--radius-lg);padding:20px;box-shadow:var(--shadow-card)}
.program-ui .mini-mcq p{color:#f3f7fb;font-size:.92rem;margin-bottom:14px}
.program-ui .mini-mcq ul{display:flex;flex-direction:column;gap:8px}
.program-ui .mini-mcq li{
  display:flex;align-items:flex-start;gap:10px;padding:10px 13px;
  border-radius:10px;border:1px solid rgba(255,255,255,.14);
  font-size:.87rem;color:#d7e2ec;
}
.program-ui .mini-mcq li.is-correct{border-color:rgba(143,212,207,.55);background:rgba(14,149,148,.16);flex-wrap:wrap}
.program-ui .mini-mcq li.is-wrong{border-color:rgba(229,161,58,.4)}
.program-ui .mini-mcq .opt-letter{background:rgba(255,255,255,.08)}
.program-ui .mini-mcq li.is-correct .opt-letter{background:var(--teal-600);color:#fff}
.program-ui .mini-mcq .opt-explain{
  flex-basis:100%;margin-top:8px;padding-top:8px;
  border-top:1px dashed rgba(255,255,255,.18);
  font-size:.8rem;color:var(--teal-300);line-height:1.5;
}
 
/* Labeled diagram photo */
.program-ui .diagram-figure{margin:0;border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-card);border:1px solid var(--line)}
.program-ui .diagram-figure img{width:100%;height:100%;object-fit:cover;display:block}
 
/* Mini analytics chart visual */
.program-ui .mini-chart{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-lg);padding:26px;box-shadow:var(--shadow-card)}
.program-ui .mini-chart-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.program-ui .mini-chart-head span:first-child{font-family:var(--font-mono);font-size:.8rem;color:var(--ink-500);text-transform:uppercase;letter-spacing:.06em}
.program-ui .mini-chart-score{font-family:var(--font-mono);font-weight:600;color:var(--teal-600);font-size:1.1rem}
.program-ui .mini-chart-bars{display:flex;align-items:flex-end;gap:14px;height:150px}
.program-ui .mini-chart-bar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:8px}
.program-ui .mini-chart-bar span.bar{
  width:100%;border-radius:6px 6px 2px 2px;
  background:linear-gradient(180deg, var(--blue-600), var(--teal-600));
}
.program-ui .mini-chart-bar.is-low span.bar{background:linear-gradient(180deg, var(--amber-500), #d98e2a)}
.program-ui .mini-chart-bar label{font-size:.72rem;color:var(--ink-500);text-align:center}
 
@media (max-width:900px){
.program-ui .home-hero-grid{grid-template-columns:1fr}
.program-ui .feature-row, .program-ui .feature-row.reverse .feature-row-media{grid-template-columns:1fr;order:0}
.program-ui .feature-row{grid-template-columns:1fr}
}
.program-ui [data-reveal]{opacity:0;transform:translateY(16px);transition:opacity .5s ease, transform .5s ease}
.program-ui [data-reveal].is-visible{opacity:1;transform:none}
 
/* ============ Responsive ============ */
@media (max-width:960px){
.program-ui .stats-grid{grid-template-columns:repeat(2,1fr)}
.program-ui .stat{border-left:none;padding-left:0;border-top:1px solid rgba(255,255,255,.14);padding-top:18px}
.program-ui .stat:nth-child(1), .program-ui .stat:nth-child(2){border-top:none;padding-top:0}
.program-ui .feature-grid{grid-template-columns:1fr}
.program-ui .testimonial-grid{grid-template-columns:1fr}
.program-ui .footer-grid{grid-template-columns:1fr;gap:28px}
}
@media (max-width:600px){
.program-ui .section{padding:64px 0}
.program-ui h1{font-size:2rem !important}
}

/* Demo modal (shared DemoModal component) */
.program-ui .modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.55);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.program-ui .modal-card {
  background: var(--surface);
  border-radius: 14px;
  width: 100%;
  max-width: 480px;
  padding: 36px 32px;
  position: relative;
  box-shadow: 0 20px 60px rgba(15,23,42,0.25);
}
.program-ui .modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ink-500);
}
.program-ui .modal-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 22px;
}
.program-ui .modal-title {
  font-size: 1.15rem;
  text-align: center;
  margin-bottom: 24px;
  line-height: 1.4;
  font-family: var(--font-display);
  color: var(--navy-950);
}
.program-ui .field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}
.program-ui .field {
  display: block;
  font-size: 0.82rem;
  color: var(--ink-500);
  font-weight: 500;
}
.program-ui .field input,
.program-ui .field select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--line);
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--ink-900);
  background: var(--surface);
  margin-top: 6px;
}

/* Demo lead modal stays light even in dark mode */
.program-ui .demo-lead-modal {
  background: #ffffff !important;
  color: #0f172a !important;
  color-scheme: light;
}
.program-ui .demo-lead-modal .modal-title,
.program-ui .demo-lead-modal .modal-brand {
  color: #0f172a !important;
}
.program-ui .demo-lead-modal .modal-title {
  white-space: nowrap;
  font-size: clamp(0.95rem, 2.4vw, 1.1rem);
  line-height: 1.35;
}
.program-ui .demo-lead-modal {
  max-width: min(560px, calc(100vw - 2rem));
}
.program-ui .demo-lead-modal .modal-close {
  color: #64748b !important;
}
.program-ui .demo-lead-modal .field {
  color: #475569 !important;
}
.program-ui .demo-lead-modal .field input,
.program-ui .demo-lead-modal .field select {
  background: #ffffff !important;
  color: #0f172a !important;
  border: 1px solid #d1d5db !important;
  color-scheme: light;
  -webkit-text-fill-color: #0f172a;
}
.program-ui .demo-lead-modal .field input::placeholder {
  color: #94a3b8 !important;
  -webkit-text-fill-color: #94a3b8;
}

.program-ui .required { color: #DC2626; }
.program-ui .brand-mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--mkt-accent, var(--blue-600));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.program-ui .brand-mark img {
  width: 62%;
  height: 62%;
  object-fit: contain;
  display: block;
}
@media (max-width:640px){
  .program-ui .field-row { grid-template-columns: 1fr; }
}
`;
