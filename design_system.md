# Redactify Design System (v2.0)

## Mandatory Compliance Rule

> **MANDATORY RULE:** Any future UI changes, new components, or modifications across Redactify MUST strictly adhere to this design system. No ad-hoc styles, conflicting border-radii, unapproved typography pairings, or divergent color tokens are permitted.

---

## 1. Design Philosophy

Redactify couples **Warm Editorial Technicality** with **Air-Gapped Zero-Trust Privacy**:
- **Warm Editorial Tone**: Warm paper backgrounds (`#fafaf9`), crisp white surfaces (`#ffffff`), restrained warm cream wells (`#f5f5f4`), and subtle architectural borders (`#e7e5e4`).
- **Monochrome & Amber Accents**: High contrast ink typography (`#292524`, `#000000`) paired with subtle amber security highlights (`amber-600` / `amber-700` / `amber-800`).
- **Precision Typography**: Editorial headlines in `Cooper LtBT` serif, UI copy in `Geist` sans-serif, and technical status markers, button labels, and kickers in `Geist Mono`.
- **Zero Fluff / Zero Telemetry**: Every pixel conveys privacy, speed, and local in-memory security.

---

## 2. Color Palette & Tokens

| Token | CSS Variable / Utility | Hex Value | Purpose |
| :--- | :--- | :--- | :--- |
| `warm-bone` | `bg-warm-bone` | `#fafaf9` | Canvas background for entire viewport |
| `paper-white` | `bg-paper-white` | `#ffffff` | Elevated cards, dialog surfaces, toolbars |
| `soft-cream` | `bg-soft-cream` | `#f5f5f4` | Recessed wells, input backgrounds, segmented tracks |
| `stone-mist` | `border-stone-mist` | `#e7e5e4` | Standard structural borders and dividers |
| `charcoal` | `text-charcoal` / `bg-charcoal` | `#292524` | Primary ink text, primary buttons, active tabs |
| `black` | `text-black` / `bg-black` | `#000000` | Brand logo wordmark, deepest contrast accents |
| `bark-grey` | `text-bark-grey` | `#79716b` | Secondary labels, descriptions, metadata |
| `amber-50` | `bg-amber-50` | `#fffbeb` | Subtle security banner and pro badge background |
| `amber-200` | `border-amber-200` | `#fde68a` | Subtle security borders |
| `amber-700` | `text-amber-700` / `bg-amber-700` | `#b45309` | High-emphasis security indicator, checkmarks |
| `amber-800` | `text-amber-800` / `bg-amber-800` | `#92400e` | Pro action button, dark amber accents |
| `rose-50` / `rose-200` / `rose-800` | Standard Tailwind | Semantic error states and diagnostic alerts |

---

## 3. Typography Hierarchy

### 3.1 Font Families
1. **Editorial Serif (`font-serif`)**:
   - Primary: `Cooper LtBT`
   - Fallbacks: `Fraunces`, `Playfair Display`, `Georgia`, `serif`
   - Usage: Main hero headlines, section headings, card titles.
2. **Interface Sans (`font-sans`)**:
   - Primary: `Geist`
   - Fallbacks: `Inter`, system font stack
   - Usage: Explanatory copy, feature descriptions, dialog body text.
3. **Technical Monospace (`font-mono`)**:
   - Primary: `Geist Mono`
   - Fallbacks: `ui-monospace`, `monospace`
   - Usage: Brand logo text (`Redactify`), button labels, kickers, badges, numbers, table headers, document statistics.

### 3.2 Typographic Roles
- **Hero Display**: `font-serif text-3xl sm:text-5xl font-normal tracking-tight text-charcoal`
- **Section Heading**: `font-serif text-2xl sm:text-3xl font-normal tracking-tight text-charcoal`
- **Section Kicker**: `font-mono text-xs uppercase tracking-widest text-bark-grey font-semibold`
- **Body Prose**: `font-sans text-xs sm:text-sm text-bark-grey leading-relaxed`
- **Action Button Label**: `font-mono text-xs uppercase font-semibold tracking-wider`
- **Metadata / Stats**: `font-mono text-xs font-medium text-charcoal`

---

## 4. Geometry & Border Radii Standards

Strict geometric consistency is enforced across all UI components. Never use ad-hoc Tailwind classes like `rounded-xl`, `rounded-2xl`, or `rounded-3xl`.

| Class | Pixel Radius | Approved Components |
| :--- | :--- | :--- |
| `rounded-card` | `16px` | Cards, structural panels, dropzones, dialog modals, FAQ items |
| `rounded-button` | `8px` | Primary / secondary action buttons, text inputs, textareas, dropdowns, code/trace boxes |
| `rounded-tag` | `8px` | Badges, tags, license status pills, format markers |
| `rounded-full` | `9999px` | Segmented dock navigation, pill toggles, status indicator dots, circular icon containers |
| `rounded-sm` | `2px` | In-canvas text highlight boxes and redaction overlays |

---

## 5. Component Specifications

### 5.1 Universal Header & Navigation
- **Container**: `h-16 border-b border-stone-mist bg-paper-white/95 backdrop-blur-md px-4 sm:px-6 md:px-8`
- **Brand Mark**:
  - Icon: Minimalist document redaction emblem SVG (`18x18`, `stroke="currentColor"`, `strokeWidth="2.2"`).
  - Wordmark: `<span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-black uppercase">Redactify</span>`.
  - No decorative squircles or colored background tiles behind the logo.
- **Segmented Dock**:
  - Track: `p-1 rounded-full bg-soft-cream border border-stone-mist shadow-xs`
  - Active Tab: `bg-charcoal text-white rounded-full font-mono text-xs uppercase tracking-wider` with Framer Motion spring transition (`layoutId="header-active-capsule"`).
  - Inactive Tab: `text-bark-grey hover:text-charcoal font-mono text-xs uppercase tracking-wider`
- **Action Buttons**:
  - Right CTAs use `rounded-button`, height `h-9`, font `font-mono text-xs font-medium`.

### 5.2 Action Buttons
- **Primary Button**:
  `rounded-button bg-charcoal hover:bg-black text-white font-mono text-xs font-medium px-4 py-2.5 shadow-sm transition-all flex items-center justify-center gap-2`
- **Secondary / Outline Button**:
  `rounded-button bg-paper-white hover:bg-stone-mist/40 border border-stone-mist text-charcoal font-mono text-xs font-medium px-4 py-2.5 shadow-xs transition-colors`
- **Ghost / Recessed Button**:
  `rounded-button bg-soft-cream hover:bg-stone-mist/40 border border-stone-mist text-charcoal font-mono text-xs font-medium px-3 py-1.5 transition-colors`

### 5.3 Form Controls & Inputs
- **Text Inputs & Dropdowns**:
  `rounded-button bg-soft-cream border border-stone-mist text-xs font-mono text-charcoal px-3.5 py-2 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal`
- **Textarea**:
  `rounded-button bg-soft-cream border border-stone-mist text-xs font-sans text-charcoal p-3 focus:outline-none focus:border-charcoal`

### 5.4 Cards & Structural Panels
- **Standard Card**:
  `rounded-card bg-paper-white border border-stone-mist p-6 sm:p-8 shadow-card`
- **Recessed Well**:
  `rounded-card bg-soft-cream border border-stone-mist p-4 sm:p-6`
- **Featured / Highlighted Card**:
  `rounded-card bg-paper-white border-2 border-charcoal p-6 sm:p-8 shadow-card-hover`

### 5.5 Modals & Overlays
- **Backdrop**: `fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4`
- **Dialog Surface**: `relative w-full max-w-lg bg-paper-white border border-stone-mist rounded-card shadow-card-hover overflow-hidden text-left`
- **Close Button**: `absolute top-3.5 right-3.5 p-1.5 rounded-full text-bark-grey hover:text-charcoal hover:bg-stone-mist/30 transition-colors`

---

## 6. Shadows & Elevations

- `shadow-xs`: Subtle elevation for segmented buttons, badges, and small controls.
- `shadow-sm`: Standard resting elevation for action buttons.
- `shadow-card`: Resting elevation for standard content cards and panels (`rgba(0, 0, 0, 0.05) 0px 1px 3px 0px`).
- `shadow-card-hover`: Elevated state for highlighted cards and dialog surfaces (`rgba(0, 0, 0, 0.08) 0px 10px 20px -3px`).
- `shadow-showcase`: High-impact presentation shadow for interactive previews and illustration cards.

---

## 7. Motion & Animation Standards

1. **GSAP ScrollTrigger**:
   - Bi-directional reactivity: animations play smoothly on both scroll down and scroll up.
   - Parallax image reveals: subtle scale and scrubbed vertical translate.
   - Fast and light easing: power2.out or cubic-bezier for snappy response.
2. **Framer Motion Micro-interactions**:
   - Spring transitions for pill selection docks (`stiffness: 420, damping: 32`).
   - Button tap scale feedback: `whileTap={{ scale: 0.97 }}`.
   - Button hover elevation: `whileHover={{ scale: 1.02, y: -1 }}`.
3. **Clean Teardown**:
   - Always clean up GSAP timelines and ScrollTrigger instances on component unmount to prevent memory leaks.

---

## 8. Development & Review Checklist

Before opening a pull request or submitting changes, every developer and agent must verify:
- [ ] No ad-hoc border radii used (only `rounded-card`, `rounded-button`, `rounded-tag`, `rounded-full`, `rounded-sm`).
- [ ] Colors strictly follow token names (`warm-bone`, `paper-white`, `soft-cream`, `stone-mist`, `charcoal`, `bark-grey`, `amber-*`).
- [ ] Typography follows the three-font hierarchy: Editorial Serif (`Cooper LtBT`), UI Sans (`Geist`), Technical Mono (`Geist Mono`).
- [ ] Responsive design verified on mobile (375px), tablet (768px), and desktop (1280px+).
- [ ] Zero em dashes (`\u2014`) in any source files or documentation.
- [ ] All automated tests pass (`npm test`).
- [ ] Production build succeeds cleanly (`npm run build`).
