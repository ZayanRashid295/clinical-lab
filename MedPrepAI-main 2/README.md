# MedPrepAI — v2 file structure, asset table & merge guide

This update adds, per your latest instructions:
1. Dedicated (non-shared) images for FCPS-1 and JCAT (MDMS)
2. A 5-image "QBank" carousel (center image inward, sides pushed outward) on both track pages
3. A static 3-card "Resources" section on both track pages
4. A sliding testimonials carousel (3 reviews per page, arrows + dots + "Read More Reviews") with 9 reviews per track
5. FAQ sections (unchanged — already present on Home, FCPS-1, JCAT)
6. Full mobile responsiveness for every new section

The Home page keeps its existing white/light theme, headings, and asset filenames
exactly as they were — nothing on Home was renamed or restructured.

---

## 1. How to merge this into your existing project

You do **not** need to recreate your Vite project. This zip only replaces the
`src/` folder (plus `package.json` / `vite.config.js` / `index.html` are included
here only so this folder can also run standalone if you want to preview it).

**Steps:**

1. Unzip this package.
2. In your real `MEDPREP` project, back up or delete the current `src/` folder.
3. Copy this package's entire `src/` folder into your `MEDPREP` project root
   (replacing the old one).
4. Copy in your real screenshots (see the asset table in section 2) — every file
   already has a placeholder image generated at the correct path, so the project
   builds and runs immediately even before you add real screenshots. Just
   overwrite each placeholder with your real image **using the exact same
   filename**, and no code changes are needed.
5. From your project root:
   ```
   npm install
   npm run dev
   ```
6. Confirm all 3 pages render (Home, FCPS-1, JCAT), then `npm run build` to confirm
   a clean production build before deploying.

Nothing in `package.json` changes — no new dependencies were added (no router
library; page switching still uses the existing `page` state in `App.jsx`, same
approach as before).

---

## 2. Asset table — fill these in with your real screenshots

Every path below already contains a labeled placeholder image, generated at a
realistic size, so you can replace them one at a time without breaking anything.

### Home page (all files from your assets folder are now used)

| # | Filename | Used on | Suggested size |
|---|---|---|---|
| 1 | `src/assets/logo-icon.png` | Header + Footer brand mark | 128×128 |
| 2 | `src/assets/hero.png` | Home hero section (right-side screenshot) | 1200×900 |
| 3 | `src/assets/exam-interface-screenshot.jpeg` | Home → "Every option explained" split section | 1200×900 |
| 4 | `src/assets/team-ai-collaboration.png` | Home → "Same data, same view" split section | 1200×900 |
| 5 | `src/assets/faculty-analytics-dashboard_brightened.png` | Home → "See exactly where you stand" split section | 1200×900 |
| 6 | `src/assets/doctor-patient-screen.png` | Home → "Choose your exam" — FCPS-1 card | 1200×900 |
| 7 | `src/assets/faculty-analytics-dashboard.png` | Home → "Choose your exam" — JCAT (MDMS) card | 1200×900 |

`react.svg` and `vite.svg` are Vite's default template icons (not content images) — left alone, safe to delete.

### FCPS-1 page (new — `src/assets/fcps/`)

| # | Filename | Used on | Suggested size |
|---|---|---|---|
| 1 | `src/assets/fcps/hero.png` | Hero section device screenshot | 1200×900 |
| 2 | `src/assets/fcps/qbank-1.png` | QBank carousel, slide 1 | 1000×700 |
| 3 | `src/assets/fcps/qbank-2.png` | QBank carousel, slide 2 | 1000×700 |
| 4 | `src/assets/fcps/qbank-3.png` | QBank carousel, slide 3 | 1000×700 |
| 5 | `src/assets/fcps/qbank-4.png` | QBank carousel, slide 4 | 1000×700 |
| 6 | `src/assets/fcps/qbank-5.png` | QBank carousel, slide 5 | 1000×700 |
| 7 | `src/assets/fcps/resource-1.png` | Resources card 1 (testing interface) | 900×600 |
| 8 | `src/assets/fcps/resource-2.png` | Resources card 2 (reasoning walkthroughs) | 900×600 |
| 9 | `src/assets/fcps/resource-3.png` | Resources card 3 (visual explanations) | 900×600 |
| 10 | `src/assets/fcps/cta-preview.png` | Small preview thumbnail above the final CTA | 900×500 |

### JCAT (MDMS) page (new — `src/assets/jcat/`)

Same 10-file pattern, same suggested sizes, inside `src/assets/jcat/`:
`hero.png`, `qbank-1.png` … `qbank-5.png`, `resource-1.png` … `resource-3.png`, `cta-preview.png`

> Tip: keep FCPS-1 and JCAT screenshots visually distinct (different question
> stems, different subjects) — that's the whole point of splitting them out of
> the old shared `hero.png` / `exam-interface-screenshot.jpeg` files.

---

## 3. Full architecture (merged state)

```
medprepai/
├── index.html
├── package.json
├── vite.config.js
├── README.md                          ← this file
└── src/
    ├── main.jsx                       entry point (unchanged)
    ├── App.jsx                        page router: home / fcps / jcat (useState, no library)
    ├── index.css                      all styles, incl. new carousel/resource/testimonial CSS
    │                                  + mobile rules (@media 900px / 640px)
    │
    ├── components/
    │   ├── Header.jsx                 nav: Home / FCPS-1 / JCAT (MDMS), mobile menu
    │   ├── Footer.jsx                 footer links (same setPage navigation)
    │   ├── Button.jsx                 shared <Btn>
    │   ├── Icons.jsx                  shared inline SVG icon set (+ left/right/quote/star)
    │   ├── StatsBar.jsx               4-stat row under hero
    │   ├── FeatureGrid.jsx            "grid" (Home) or "strip" (track pages) layouts
    │   ├── SplitSection.jsx           generic image+text split (used on Home only now)
    │   ├── TrackSelector.jsx          "Choose your exam" cards on Home
    │   ├── QBankCarousel.jsx          NEW — 5-image inward/outward peek carousel
    │   ├── ResourceGrid.jsx           NEW — static 3-card resources section
    │   ├── HowItWorks.jsx             4-step process (shared across pages)
    │   ├── Testimonials.jsx           UPDATED — now a 3-per-page sliding carousel
    │   ├── FAQAccordion.jsx           accordion FAQ (shared across pages)
    │   ├── CTASection.jsx             UPDATED — optional preview image above CTA
    │   └── DemoModal.jsx              "View Sample Questions" form modal
    │
    ├── data/
    │   ├── programData.js             UPDATED — added qbank + resources copy per track
    │   ├── testimonialData.js         UPDATED — 9 reviews per track (was 3)
    │   └── faqData.js                 unchanged
    │
    ├── pages/
    │   ├── Home.jsx                   UNCHANGED — same assets, same copy, same order
    │   ├── FCPS.jsx                   REWRITTEN — dedicated assets + new sections
    │   └── JCAT.jsx                   REWRITTEN — dedicated assets + new sections
    │
    └── assets/
        ├── logo-icon.png              } Home assets — same filenames as before
        ├── team-ai-collaboration.png  }
        ├── doctor-patient-screen.png  }
        ├── fcps/                      NEW — 10 dedicated FCPS-1 images (see table)
        └── jcat/                      NEW — 10 dedicated JCAT (MDMS) images (see table)
```

**Data flow (per track page):** `pages/FCPS.jsx` / `pages/JCAT.jsx` import their
own images directly, read copy from `PROGRAMS.fcps` / `PROGRAMS.jcat` in
`data/programData.js`, and pass everything down as props into the shared
`components/*` — so the two pages stay pixel-identical in structure while only
content and images differ (per your point 5).

**Page order on each track page** (matches your numbered reference screenshots):
Hero (1.1) → QBank carousel (1.2) → Resources 3-card (1.3) → Feature strip →
How It Works → Testimonials carousel (1.4) → CTA → FAQ (1.5).

---

## 4. Mobile responsiveness

All new sections have mobile rules in `index.css`:
- **QBank carousel**: side-peek images shrink further and fade more on small
  screens; arrows shrink; stage height reduces. Swiping is via the arrow buttons
  (tap-friendly, 34–42px targets).
- **Resources grid**: 3 columns → 1 column under 900px; on very small screens
  (≤640px) it shows 2 of 3 cards to avoid a very long scroll, consistent with
  how the rest of the site trims repeated cards on mobile.
- **Testimonials carousel**: 3-per-page → 2-per-page (900px) → 1-per-page
  (640px), with the same arrow/dot navigation at every size.
- All existing Home/FCPS/JCAT responsive rules (stat tiles, feature grids,
  header hamburger menu, footer stacking) are unchanged from before.

---

## 5. On your item 7 (home page theme reference)

I wasn't able to load `https://uworld-zayan.org/` directly (it doesn't appear in
search results, so my fetch tool can't reach it). However, your existing
`Home.jsx` / `index.css` already use a white background (`--paper: #FFFFFF`),
a teal accent, Georgia-serif headings, and short body copy under each heading —
which is the same direction you described. If that reference site has specific
layout details you want copied exactly, send me a screenshot of it (like you did
for the UWorld pages) and I'll match it precisely.
