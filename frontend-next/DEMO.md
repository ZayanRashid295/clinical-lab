# In-app product demo

A full-screen, auto-playing product walkthrough (~105 seconds) built with React and CSS animations—no embedded video file. Covers the **full MedPrepAI platform**: the **AI Simulation** simulation module (4 modes) and the **Clinical Lab** QBank module (MCQs).

## Open the demo

- **Landing page:** click **Watch demo** in the hero or bottom CTA.
- **Deep link:** append `#demo` to the landing URL (e.g. `https://yoursite.com/#demo`).

Press **Esc** or **Exit** to close. The `#demo` hash is cleared when you exit.

## Edit scenes

Scene order, durations, and presenter scripts live in:

`src/app/components/demo/demo-registry.ts`

Each entry has:

- `duration` — milliseconds the scene stays visible before auto-advance
- `notes` — presenter script (toggle with **N** in the player)
- `Component` — scene UI in `demo-scenes.tsx`

Total runtime ≈ sum of all `duration` values (`DEMO_TOTAL_MS`).

Visual primitives and hooks: `demo-primitives.tsx`, `demo-hooks.ts`.

- AI Simulation snapshots: `demo-mode-snapshots.tsx`, `demo-mode-data.ts`  
- Clinical Lab snapshots: `demo-clinical-lab-snapshots.tsx`  
- Platform (two modules): `demo-platform-snapshots.tsx`, `demo-platform-data.ts`

Global motion: `src/styles/demo.css` (imported from `src/index.css`).

### Scene order

1. Intro (two modules: AI Simulation + Clinical Lab)  
2. Problem  
3. **Platform overview** (two module cards)  
4. **AI Simulation hub** (four simulation mode cards)  
5. **Practice / Learning / Evaluation / Shadow** — each with in-app snapshot  
6. **Clinical Lab · Create Test** — tutor/timed, pools, systems & topics  
7. **Clinical Lab · MCQ session** — tutor explanations  
8. Institutions setup (both modules)  
9. Impact metrics  
10. CTA  

Reference screenshots: `public/demo/modes-hub-reference.png`, `public/demo/create-test-reference.png`.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `←` / `→` | Previous / next scene |
| `Space` | Play / pause |
| `R` | Restart from first scene |
| `H` | Hide / show player chrome (for recording) |
| `N` | Toggle presenter notes |
| `F` | Fullscreen |
| `Esc` | Exit fullscreen, or exit demo |

Click the **?** control in the player for the same list.

## Screen recording (optional MP4 export)

1. Open the demo (fullscreen recommended: **F**).
2. Press **H** to hide UI chrome.
3. Record with OBS, QuickTime, or similar.
4. The React demo is the storyboard; exporting MP4 is a separate step.

## Brand tokens

Demo neutrals use Tailwind `demo-50` … `demo-950`. Accent uses theme `primary-*` CSS variables from `src/styles/theme.css`.
