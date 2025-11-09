# UWorld USMLE Question Bank - Design Guidelines

## Design Approach: Professional Medical Education Platform

**Selected Framework:** Design System Approach (Material Design + Healthcare UI patterns)
**Justification:** This is a utility-focused, information-dense medical education platform where functionality, data clarity, and user efficiency are paramount. Students rely on this tool for exam preparation, requiring stable, consistent patterns and clear information hierarchy.

**Core Design Principles:**
- Clinical precision in data presentation
- Cognitive load reduction through clear hierarchy
- Trust-building through professional aesthetics
- Efficient navigation for time-pressed medical students
- Accessibility for extended study sessions

---

## Color Palette

### Light Mode
**Primary Colors:**
- Primary Blue: 210 100% 45% (UWorld-inspired professional blue for headers, CTAs, active states)
- Primary Dark: 210 100% 35% (darker variant for hover states)
- Background: 0 0% 98% (soft off-white for reduced eye strain)
- Surface: 0 0% 100% (pure white for cards and containers)

**Functional Colors:**
- Success Green: 142 71% 45% (correct answers, completion states)
- Error Red: 0 72% 51% (incorrect answers, alerts)
- Warning Amber: 38 92% 50% (marked questions, caution states)
- Info Blue: 210 100% 55% (informational messages)

**Text & Borders:**
- Text Primary: 210 15% 20% (dark blue-gray for main content)
- Text Secondary: 210 10% 45% (medium gray for labels)
- Text Tertiary: 210 8% 65% (light gray for hints)
- Border: 210 15% 90% (subtle borders for separation)

### Dark Mode
**Primary Colors:**
- Primary Blue: 210 100% 65% (brighter for dark backgrounds)
- Primary Dark: 210 100% 55% (hover variant)
- Background: 210 15% 8% (deep blue-black base)
- Surface: 210 12% 12% (elevated cards)

**Functional Colors:**
- Success Green: 142 71% 55%
- Error Red: 0 72% 60%
- Warning Amber: 38 92% 60%
- Info Blue: 210 100% 65%

**Text & Borders:**
- Text Primary: 210 15% 92%
- Text Secondary: 210 10% 70%
- Text Tertiary: 210 8% 50%
- Border: 210 15% 20%

---

## Typography

**Font Families:**
- Primary: 'Inter' (clean, highly legible for medical terminology)
- Monospace: 'JetBrains Mono' (for IDs, codes, statistics)

**Type Scale:**
- Display: 32px / 700 (Dashboard headers, page titles)
- H1: 24px / 600 (Section headers)
- H2: 20px / 600 (Subsection headers)
- H3: 16px / 600 (Card titles, labels)
- Body Large: 16px / 400 (Primary content, question text)
- Body: 14px / 400 (Secondary content, descriptions)
- Small: 12px / 400 (Metadata, timestamps, hints)
- Caption: 11px / 500 (Table headers, tags, uppercase labels)

**Line Heights:** 1.5 for body text, 1.3 for headings

---

## Layout System

**Spacing Primitives:** Use Tailwind units: 2, 3, 4, 6, 8, 12, 16, 24
- Micro spacing (chips, badges): p-2, gap-2
- Component internal: p-4, gap-4
- Between sections: py-8, gap-6
- Page sections: py-12 to py-16
- Large breakpoints: py-24

**Container Widths:**
- Sidebar Navigation: 240px fixed
- Main Content Area: flex-1 with max-w-7xl
- Form Containers: max-w-4xl
- Modal Dialogs: max-w-2xl

**Grid Systems:**
- Dashboard Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Statistics Row: grid-cols-2 md:grid-cols-4
- Test Creation Filters: Two-column layout (filters left, preview right)

---

## Component Library

### Navigation
**Sidebar Navigation:**
- Fixed left sidebar with logo at top
- Collapsible menu groups (QBank, Flashcards, etc.)
- Active state with left border accent (4px primary blue bar)
- Icon + label pattern throughout
- Expiration date badge at top

**Top Bar:**
- Breadcrumb navigation (Home > Section > Page)
- User account dropdown (right-aligned)
- Help icon and notifications

### Data Display
**Statistics Cards:**
- White/surface background with subtle shadow
- Large metric number (32px) with label below
- Progress ring/bar for percentage metrics
- Icon in corner for visual association
- Hover state: subtle lift with increased shadow

**Data Tables:**
- Sticky header row with sort indicators
- Alternating row backgrounds for readability
- Action buttons (Resume, Results, Analysis) right-aligned
- Pagination controls at bottom
- Column customization menu
- Row hover: subtle background change

**Progress Indicators:**
- Circular progress rings for percentages (QBank usage, Study plan)
- Linear progress bars with segments (completed/overdue/incomplete)
- Color-coded segments (green=complete, red=overdue, gray=incomplete)

### Forms & Inputs
**Test Creation Interface:**
- Two-panel layout (configuration left, summary right)
- Radio button groups with descriptive text below options
- Checkboxes for multi-select (subjects, systems)
- Expandable accordion sections (Systems with "Expand All" control)
- Number input with max validation
- Primary CTA button: "GENERATE TEST" (full width, prominent)

**Input Fields:**
- Label above input (12px, semibold, text-secondary)
- Input border: 1px solid border color, rounded-md
- Focus state: 2px primary blue border, subtle glow
- Error state: red border with error message below
- Disabled state: reduced opacity, gray background

**Select Dropdowns:**
- Custom styled with chevron indicator
- Hover: subtle background change
- Open state: border remains, options panel drops below
- Selected item highlighted in list

### Cards & Containers
**Dashboard Cards:**
- Rounded corners (rounded-lg)
- Padding: p-6
- Shadow: shadow-sm (subtle)
- Hover: shadow-md transition
- Title with icon, content area, footer with action

**Study Planner Task Cards:**
- Left border color-coded by status (blue=upcoming, red=overdue)
- Task name, type tag, duration
- Checkbox interaction for completion

### Buttons & CTAs
**Primary Button:**
- Background: primary blue, text: white
- Padding: px-6 py-3
- Rounded: rounded-md
- Hover: darker primary shade, subtle lift
- Font: 14px semibold, uppercase letter-spacing

**Secondary/Outline Button:**
- Border: 2px primary blue, text: primary blue
- Background: transparent
- When over images: backdrop-blur-sm with bg-white/10
- Hover: background fills with primary color

**Icon Buttons:**
- Square (w-10 h-10), rounded-md
- Subtle background hover
- Icons from Heroicons (outline style)

### Modals & Overlays
**Modal Dialogs:**
- Centered overlay with backdrop blur
- White/surface card with rounded-xl
- Header with title and close button
- Content area with appropriate padding
- Footer with action buttons (right-aligned)

**Toast Notifications:**
- Top-right positioned
- Color-coded by type (success/error/warning/info)
- Icon + message + dismiss button
- Auto-dismiss after 5 seconds
- Slide-in animation

### Special Components
**Question Display:**
- Full-width card with question text (body-large)
- Multiple choice options as radio buttons in list
- "Mark for review" flag in corner
- Submit/Next button at bottom

**Performance Charts:**
- Bar charts for subject breakdown
- Line graphs for score trends over time
- Color-coded segments matching functional colors
- Axis labels and grid lines in text-tertiary

---

## Iconography

**Icon Library:** Heroicons (outline style)
**Common Icons:**
- Dashboard: chart-bar, academic-cap
- Create Test: document-plus, cog
- Previous Tests: clock, clipboard-list
- Search: magnifying-glass
- Notes: pencil-square
- Settings: cog-6-tooth
- Chevrons for expand/collapse

---

## Images

This application uses minimal decorative imagery, focusing on functional UI elements:

**No Hero Images Required** - This is a utility application, not a marketing site

**Image Usage:**
- User avatars (circular, 32px or 40px)
- UWorld logo in navigation (brand identity)
- Empty state illustrations for:
  - No tests created yet (clipboard with checkmark)
  - No notes saved (notepad with pencil)
  - Study planner empty state (calendar icon)
- Chart/graph visualizations for performance data

---

## Animations & Interactions

**Minimal, Purposeful Motion:**
- Page transitions: None (instant for speed)
- Dropdown menus: 150ms ease-out slide down
- Modal overlays: 200ms fade in with slight scale up
- Button hovers: 100ms color transition
- Progress updates: Smooth 300ms count-up animations
- Accordion expand/collapse: 250ms ease-in-out
- Toast notifications: Slide-in from right (200ms)

**Micro-interactions:**
- Checkbox check animation (scale + checkmark draw)
- Radio button selection (ripple effect)
- Loading states: Subtle pulse on skeleton screens
- Success confirmations: Brief green flash on save

---

## Accessibility & UX Considerations

- Maintain WCAG AA contrast ratios minimum
- Keyboard navigation for all interactive elements
- Focus indicators: 2px offset outline in primary color
- Screen reader labels for icon-only buttons
- Error messages announced to assistive tech
- Time limits (for timed tests) clearly displayed with warnings
- Sufficient touch targets (minimum 44px) for mobile
- Consistent dark mode throughout including form inputs