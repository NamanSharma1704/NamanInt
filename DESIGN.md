# Design System: NAMAN INTERNATIONAL LTD

> **Visual World**: High-Trust International Trade & Maritime Logistics Infrastructure.
> Governed by **UI/UX Pro Max**, **Impeccable**, and **Taste Skill**.

---

## 1. Visual World & Creative Direction

NAMAN INTERNATIONAL LTD coordinates high-volume overseas procurement, container logistics, and factory floor quality assurance between Asia manufacturing hubs (Shenzhen, Dongguan, Ningbo) and North American retailers.

- **Atmosphere**: Authoritative, institutional, restrained, precision-driven.
- **Anti-Slop Commitment**: Rejects generic AI SaaS templates, nested cards-in-cards, purple gradients, and synthetic cyan glow meshes. Emphasizes honest physical maritime scale, photographic credibility, and clear trade metrics.

---

## 2. Color System & Tokens

Derived from the enterprise logistics palette:

| Role | Token / HSL | Hex Equivalent | Description |
| :--- | :--- | :--- | :--- |
| **Primary** | `hsl(213 35% 13%)` | `#0D1D2E` | Deep oceanic navy; anchors titles, headers, and dark surfaces. |
| **Accent** | `hsl(179 80% 27%)` | `#0E7B7A` | Deep maritime teal. **Fill colour only**: buttons, rules, badge backgrounds, icons. |
| **Accent on dark** | `hsl(179 65% 45%)` | `#28BDBB` | Teal *text* on the navy surfaces. `--accent` measures 3.6–3.9:1 there and fails AA. |
| **Accent on tint** | `hsl(179 80% 23%)` | `#0C6A68` | Teal *text* on `accent/10`–`accent/15` light tints, where `--accent` measures 4.1–4.3:1. |
| **Accent Glow / Tint** | `hsl(179 80% 27% / 0.18)` | Renders as subtle teal | Selection highlight (`::selection`) and badge backgrounds. |
| **Background (Light)**| `hsl(210 20% 97%)` | `#F3F5F7` | Cool crisp grey surface for editorial clarity and high contrast. |
| **Dark Surface** | `#050E1A` / `#070F1C` | Deep obsidian navy | Authoritative banner and capability sections. |
| **Text Foreground** | `hsl(213 30% 10%)` | `#0D1B2A` | WCAG AAA contrast against light backgrounds. |
| **Muted Text** | `hsl(213 12% 44%)` | `#606A75` | Supporting descriptions and technical metadata (≥ 4.5:1). |
| **Border** | `hsl(210 15% 87%)` | `#D8DDE4` | Crisp, architectural delineation (no harsh black hairlines). |

---

## 3. Typography & Hierarchy

- **Display & Headings**: `DM Serif Display` (serif)
  - Character: Authoritative, institutional permanence.
  - Scale: `clamp(2.5rem, 5vw, 5rem)` for primary page titles; balanced line heights (`1.05` to `1.15`).
  - Strict Rule: `text-wrap: balance` on all primary headlines.
- **Interface & Body**: `Inter` (geometric neo-grotesque sans)
  - Weights: `400` (Regular), `500` (Medium), `600` (Semi-bold), `700` (Bold).
  - Line length: Clamped between `65ch` and `75ch` to guarantee comfortable readability without eye fatigue.
- **Numbers & Metrics**: `AnimeCounter` with clear suffixes (`%`, `+`, `Hubs`).

---

## 4. Components & Elevation

- **Enterprise Cards**: Single-layer boundary (`rounded-2xl border border-border bg-card shadow-sm`). Zero nested cards-in-cards.
- **Interactive Controls**:
  - `cursor-pointer` explicitly required on all clickable cards, tabs, and buttons.
  - Hover states use stable color and opacity transitions (`transition-colors duration-200`). Never use layout-shifting scale transforms (`hover:scale-105` strictly banned).
- **Iconography**: Exclusively crisp SVG icons from `lucide-react` with fixed sizing (`w-4 h-4`, `w-5 h-5`). Zero raw emojis used as UI icons.
- **Themed Browser Surfaces**:
  - `::selection`: Tinted with `--accent` at 18% opacity.
  - Scrollbars: Thin themed thumb with smooth hover transitions.
  - Caret: Custom colored to match `--accent`.

---

## 5. Motion & Micro-Interactions

- Powered by `motion/react` with spring/cubic-bezier curves (`[0.16, 1, 0.3, 1]`).
- Duration: 150ms–300ms for interface feedback; 600ms–800ms for viewport entry reveals.
- Respects `prefers-reduced-motion`. Because the motion here comes from three
  independent systems, the preference has to be honoured in three places:
  - `motion/react` scroll reveals and hero entrances: gated by `useReducedMotion()`
    in each page component. `MotionConfig` is not mounted, so the library's own
    default (`reducedMotion: "never"`) applies and every animation must opt in
    explicitly.
  - anime.js timelines (`AnimeCounter`, `AnimeCorridor`) and `BorderBeam`'s
    `strokeDashoffset`: gated by `src/lib/use-reduced-motion.ts`. Neither is a
    transform or layout property, so nothing else covers them.
  - CSS loops (carrier marquee, hero shimmer, pulsing dot, smooth scrolling):
    gated by the `@media (prefers-reduced-motion: reduce)` block in `globals.css`.
- One signature motion moment per viewport (e.g. Route corridor visualizer, precision counter increments) rather than noisy repeated animations.

---

## 6. Pre-Delivery Quality Checklist

Measured in Chrome against the **built** output (`npm run build`, then
`node dist/server.bundle.mjs`), across `/`, `/trade-services`, `/categories`,
`/company` and `/contact`. Do not tick an item here without re-measuring; the
previous revision of this list asserted four things that turned out to be false.

- [x] Zero AI-slop tells. `impeccable detect` returns one finding ("Inter is an
      overused font"), knowingly accepted: the typeface is pinned by this
      document and by PRODUCT.md.
- [x] Zero raw emojis in UI components.
- [x] Stable hover feedback without layout shift. No `hover:scale-*` in any page
      or component. (`.enterprise-card`'s `-translate-y-0.5` would breach this
      but the class is unused; delete it rather than adopt it.)
- [x] WCAG AA contrast ≥ 4.5:1 for body and controls, on every solid background.
      Verified by compositing each element's ancestor backgrounds, positioned
      overlays, gradient stops and element opacity, with scroll reveals settled.
      Was 83 failing elements (worst 2.02:1); now 0.
- [x] Text over the `/trade-services` hero photograph: verified by inspection,
      not by the automated sweep. Contrast over a photograph varies per pixel,
      so the sweep reports a range rather than a number. The `#0A1628` overlay
      runs at 88–95% opacity where the text sits, giving ≥5.5:1 even against a
      white pixel in the underlying image.
- [x] `prefers-reduced-motion` honoured by all six animation sources listed in
      §5. The CSS block is verified present in the built stylesheet and the JS
      guards in the built bundle; emulating the OS setting end-to-end was not
      possible in the browser surface used, so that last step is unverified.
- [x] `cursor: pointer` on every interactive control. Achieved structurally —
      every clickable element is a real `<button>` or `<a>`, and Tailwind v3's
      preflight sets `button, [role="button"] { cursor: pointer }`. There is no
      `cursor-pointer` class anywhere in the app. **This breaks on a Tailwind v4
      upgrade**, which changes that preflight rule to `cursor: default`.
- [x] Zero horizontal scroll across 375px, 768px, 1024px and 1440px, on all five
      routes (`scrollWidth === clientWidth` at every combination).
- [x] Full code implementation without placeholder comments.

### Not applicable

- **Dark theme.** Earlier revisions of this checklist claimed AA contrast "in
  both themes". There is no dark theme: `globals.css` defines a single `:root`
  palette with no `.dark` selector and no `prefers-color-scheme` query. The site
  is a light theme that uses dark *sections*. Reinstate this item only if a real
  theme is added.
