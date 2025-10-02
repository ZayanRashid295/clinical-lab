# Clinical Lab Learning Lab - Design Guidelines

## Design Approach

**Hybrid Strategy: Medical Credibility + Modern Engagement**

This platform combines the professional credibility of medical education tools with the engagement of modern learning platforms. Primary inspiration from:

- **Linear/Notion** for clean, professional UI patterns and navigation
- **Khan Academy/Coursera** for learning mode interfaces
- **Medical credibility** through careful color choices and clinical aesthetics

**Core Design Principles:**

1. **Trust & Credibility**: Professional medical interface that institutions and students trust
2. **Clarity Over Complexity**: Information-dense content presented with exceptional hierarchy
3. **Engagement Through Interaction**: Gamification elements feel purposeful, not gimmicky
4. **Accessible Learning**: Clear feedback, readable typography, intuitive navigation

---

## Color Palette

### Light Mode

- **Primary Medical Blue**: 210 85% 45% - Primary actions, medical credibility
- **Deep Navy**: 215 35% 25% - Headers, important text, navigation
- **Success Green**: 145 65% 45% - Correct answers, achievements, positive feedback
- **Alert Red**: 5 75% 55% - Errors, critical feedback, urgent actions
- **Accent Teal**: 180 60% 50% - Interactive elements, highlights in shadow mode
- **Neutral Gray Scale**:
  - Background: 210 20% 98%
  - Surface: 0 0% 100%
  - Border: 210 15% 85%
  - Muted text: 215 15% 45%

### Dark Mode

- **Primary Medical Blue**: 210 75% 55% - Brighter for dark backgrounds
- **Deep Navy**: 215 25% 15% - Background surfaces
- **Background**: 220 20% 10% - Main background
- **Surface**: 215 18% 14% - Cards, panels
- **Border**: 215 20% 25%
- **Text**: 210 15% 90%

---

## Typography

**Font Stack:**

- **Headers/Display**: Inter (500-700 weight) - Clean, medical-professional aesthetic
- **Body/Interface**: Inter (400-500 weight) - Excellent readability for long-form medical content
- **Monospace/Data**: 'JetBrains Mono' - SOAP notes, medical codes, timestamps

**Type Scale:**

- Display (Hero): text-5xl to text-6xl (48-60px)
- H1: text-4xl (36px) - Page titles
- H2: text-3xl (30px) - Section headers
- H3: text-2xl (24px) - Subsections
- H4: text-xl (20px) - Card titles
- Body: text-base (16px) - Primary content
- Small: text-sm (14px) - Metadata, captions
- XSmall: text-xs (12px) - Labels, timestamps

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24

- Micro spacing (between related elements): p-2, gap-2, m-2
- Component internal: p-4, p-6, gap-4
- Section spacing: py-12, py-16, py-20
- Large containers: p-8, gap-8

**Grid Strategy:**

- **Landing Page**: Full-width sections with max-w-7xl containers
- **Dashboard**: Sidebar navigation (w-64) + main content (flex-1)
- **Clinical Interface**: Split-screen layouts (50/50 or 60/40)
- **Case Library**: Grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- **Faculty Console**: Data-dense tables with responsive cards on mobile

---

## Component Library

### Navigation

- **Top Navigation Bar**: Logo left, main nav center, user profile/notifications right
- **Sidebar** (Dashboard): Collapsible, icon + label, active state with accent border-left
- **Breadcrumbs**: For deep navigation (Faculty > Cohorts > Students > Performance)

### Core UI Elements

- **Buttons**:
  - Primary: Medical blue, px-6 py-3, rounded-lg
  - Secondary: Border with hover fill
  - On images: Backdrop blur with semi-transparent background
- **Cards**: Shadow-sm, rounded-xl, p-6, hover:shadow-md transition
- **Badges**: Small, rounded-full, px-3 py-1 for status, achievements
- **Progress Bars**: Gradient from primary to accent showing rubric scores

### Learning Interface Components

- **Chat Bubbles**:
  - AI Patient: Left-aligned, neutral background
  - Student/Doctor: Right-aligned, primary tint
  - System Messages: Centered, muted
- **Timeline Review**: Vertical timeline with nodes showing student actions vs ideal pathway
- **Rubric Scorecard**: Grid layout showing 6 competency scores with visual indicators
- **SOAP Note Editor**: Monaco-style editor with syntax highlighting for medical notation

### Data Displays

- **Leaderboard Table**: Sticky header, alternating row colors, rank badges
- **Analytics Charts**: Clean line charts and bar graphs with medical blue palette
- **Case Cards**: Image thumbnail, difficulty badge, specialty tag, completion status
- **Student Progress**: Radial progress charts for each competency area

### Forms & Input

- **Search**: Prominent search bar with specialty/difficulty filters
- **Case Selector**: Dropdown with rich previews (image + metadata)
- **Assessment Forms**: Multi-step wizard with progress indicator
- **Documentation**: Textarea with character count, formatting toolbar

### Overlays

- **Modals**: Centered, max-w-2xl, rounded-xl, backdrop blur
- **Slideovers**: Right-side panel for case details, student profiles
- **Tooltips**: Small, instant feedback on hover for teachable moments
- **Notifications**: Toast-style in top-right for achievements, feedback

---

## Images & Visual Assets

### Hero Section (Landing Page)

- **Large Hero Image**: Modern medical education scene - students collaborating with technology, bright clinical environment. Image should span full viewport width (100vw) but height 70vh with gradient overlay (dark bottom for text readability)

### Throughout Platform

- **Case Thumbnails**: Medical imagery appropriate to specialty (stethoscope for IM, pediatric setting for peds, etc.) - 400x300px cards
- **Specialty Icons**: Use Heroicons Medical collection for specialties (heart for cardiology, brain for neuro, etc.)
- **Achievement Badges**: Custom SVG badges for gamification (<!-- CUSTOM ICON: Medical achievement badges with specialty symbols -->)
- **Empty States**: Friendly illustrations for empty case libraries, no students in cohort
- **Faculty Dashboard**: Data visualization graphics, chart placeholders

### Image Treatment

- All case images: Subtle border-radius (rounded-lg), shadow-sm
- Hero images: Overlay gradient (from-transparent to-black/10 for light mode)
- Thumbnails: Lazy loading, aspect-ratio-[4/3] with object-cover

---

## Interactions & Animations

**Minimal, Purposeful Motion:**

- **Page Transitions**: Simple fade-in (200ms) for route changes
- **Hover States**: Scale 1.02 on cards, shadow increase - subtle lift effect
- **Loading States**: Skeleton screens for case loading, pulse animation
- **Success Feedback**: Green check animation (300ms) on correct assessments
- **Focus States**: Prominent ring-2 ring-primary for keyboard navigation

**NO complex animations** on:

- Background elements
- Text/typography
- Navigation transitions
- Data tables

---

## Responsive Behavior

**Breakpoints:**

- Mobile: Base (default) - Stacked layouts, simplified navigation
- Tablet: md (768px) - Two columns where appropriate
- Desktop: lg (1024px) - Full feature set, multi-column grids
- Large: xl (1280px) - Optimal viewing, max-w-7xl containers

**Mobile Priorities:**

- Bottom tab navigation for main features (Dashboard, Cases, Leaderboard, Profile)
- Collapsible filters and advanced options
- Single-column case displays
- Simplified rubric views (expand to see details)

---

## Accessibility Standards

- WCAG 2.1 AA compliance minimum
- Sufficient color contrast (4.5:1 for text)
- Keyboard navigation throughout
- Screen reader friendly labels
- Focus management in modals
- Consistent dark mode implementation across all inputs and surfaces
