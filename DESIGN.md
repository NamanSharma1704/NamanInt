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

White and gold (2026-09-14). The owner first moved the site off teal to light colours. A champagne accent read as
dull, and a cobalt accent did not sit well with the logo, so the site settled on white surfaces with a bright but
restrained gold: close to the logo's own gold, with more life in it. Gold is too light to carry white text or to read as
text on white, so buttons take the logo navy for their labels, and a deeper gold ink carries links, eyebrows, icons,
figures and thin lines. There are no navy or grey bands: sections alternate between white and a warm ivory.

| Role | Token / HSL | Hex Equivalent | Description |
| :--- | :--- | :--- | :--- |
| **Primary** | `hsl(216 70% 16%)` | `#0C2549` | The logo navy. Navy buttons, button labels on gold, and the fill a hover button grows into. |
| **Accent** | `hsl(40 62% 53%)` | `#D1A03D` | Bright gold. Primary buttons, active fills, the scroll thumb, goods in the route drawing. Navy text on it (`--accent-foreground`) is 6.6:1; white measures only 2.4:1, so never white. |
| **Accent hover** | `hsl(39 60% 47%)` | `#C08D30` | Hover and pressed gold; navy text 5.3:1. |
| **Accent on tint** | `hsl(38 68% 31%)` | `#855D19` | Gold ink for text and thin lines: links, icons, stat figures, rules, rails, selected borders, focus rings, drawing highlights. 5.9:1 on white, 5.6:1 on ivory, 5.2:1 on a 10% gold tint. |
| **Gold** | `hsl(38 68% 31%)` | `#855D19` | The same ink under its own name, for eyebrow labels and their rules, mono index numbers, the network spine and the sign-off lines in the route drawing. |
| **Gold soft** | `hsl(40 45% 76%)` | `#DDCBA6` | Kraft champagne: the cartons in the container drawing and the 404 badge wash (ink on a 15% wash, 5.5:1). Never text. |
| **Accent on dark** | `hsl(42 75% 65%)` | `#E5BF63` | Kept for a navy surface should one return. |
| **Accent tint** | `hsl(40 62% 53% / 0.06–0.28)` | Gold wash | Selection (28%), the NAMAN comparison column (6%), active mobile nav and icon chips (10%). |
| **Background** | `hsl(0 0% 100%)` | `#FFFFFF` | White page, header, photo-hero overlays. |
| **Card** | `hsl(0 0% 100%)` | `#FFFFFF` | White bands, the raised closing CTA panel. |
| **Muted surface** | `hsl(42 50% 97%)` | `#FBF9F4` | Warm ivory alternating bands (governance, services, office and timeline sections) and the footer. |
| **Text foreground** | `hsl(220 45% 11%)` | `#0F1829` | Ink navy; 16.9:1 on ivory. |
| **Muted text** | `hsl(218 15% 40%)` | `#576275` | Slate supporting text. 6.2:1 on white, 5.9:1 on ivory, 5.6:1 on the NAMAN column. |
| **Border** | `hsl(40 30% 88%)` | `#EAE3D7` | Warm hairlines. |

Button depth comes from `shadow-teal` / `shadow-teal-lg` (the class names predate the palette): a tight warm contact
shadow plus a soft downward gold bloom, never a glow. General shadows are tinted with the ink navy.

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
  - `::selection`: Gold (`--accent`) at 28% under ink navy text.
  - Scrollbars: the page has no track and no gutter. On mouse and trackpad screens (`pointer: fine`), globals.css hides the root scrollbar and `ScrollThumb` (mounted in `RootLayout`) floats a slim gold thumb over the right edge: 6px at 70%, widening to 8px and firming on hover, solid while dragged. It is sized from the visible share of the page, follows scroll, resize and late content growth, and can be dragged. It is `aria-hidden`, because wheel, keyboard and touch scrolling are untouched. Touch screens keep their native overlay scrollbars. Inner scroll areas keep a slim gold thumb on a clear track, and Firefox gets the standard properties, fenced off from Chrome, which ignores `::-webkit-scrollbar` styling when they are set. If JavaScript fails on a desktop, no scrollbar shows, but the page still scrolls.
  - Caret: The gold ink, `--accent-on-tint`.
- **Homepage depth**: the first page polished under the current palette. Glass assurance chips under the hero actions; a faint gold light behind the hero copy, desktop only, because below `lg` the copy crosses the photograph; gold-ink metric figures; a raised, rounded image stage in the services sequence; gold icon chips and figures on the audience panels; bright gold goods with gold-ink sign-off lines in the route drawing; and a raised closing CTA panel with a bright-to-deep gold rule along its top edge.

---

## 5. Motion & Micro-Interactions

- Powered by `motion/react` with spring/cubic-bezier curves (`[0.16, 1, 0.3, 1]`).
- Duration: 150ms–300ms for interface feedback; 600ms–800ms for viewport entry reveals.
- Respects `prefers-reduced-motion`. Because the motion here comes from seven
  independent systems, the preference has to be honoured in seven places:
  - `motion/react` scroll reveals and hero entrances: gated by `useReducedMotion()`
    in each page component. `MotionConfig` is not mounted, so the library's own
    default (`reducedMotion: "never"`) applies and every animation must opt in
    explicitly.
  - anime.js timelines (`AnimeCounter`): gated by
    `src/lib/use-reduced-motion.ts`. A timeline isn't a transform or layout
    property, so nothing else covers it. `BorderBeam` uses the same hook but is no
    longer rendered on any page.
  - CSS loops (carrier marquee, hero shimmer, pulsing dot, smooth scrolling):
    gated by the `@media (prefers-reduced-motion: reduce)` block in `globals.css`.
  - The trade-network WebGL scene (`src/components/trade-network`): starts
    from `prefersReducedMotionNow()` and follows `usePrefersReducedMotion()`
    afterwards. Under reduced motion it draws one still frame and never starts
    its render loop. The loop also stops whenever the drawing is off screen or
    the tab is hidden.
  - The homepage services sequence (`src/components/ServicesSequence.tsx`):
    the crossfade between services is a CSS transition switched off by
    `motion-reduce:transition-none`, and jump-to-service scrolling uses
    `behavior: 'auto'` under reduced motion. The pinning itself is scroll
    position, not animation, so it stays.
  - The Precision Hardware inspection drawing on Categories
    (`src/components/housing-inspection`): a hidden-line WebGL drawing of the
    housing in the category photograph, reached through a "Photograph /
    Inspection drawing" switch that only appears once WebGL 2 is confirmed. The
    photograph stays the default and the fallback, and Three.js loads only when
    the switch is pressed. Its slow sway follows the same rules as the
    trade-network scene. The photograph-to-drawing crossfade uses
    `motion-reduce:transition-none`. Each inspection protocol pins its numbered
    point when pressed, and previews it on mouse hover or keyboard focus.
  - The Trade Services container load sequence
    (`src/components/container-load`): a pinned section where scrolling lowers
    a 20ft container onto its landing marks, releases the rig, opens the doors
    and stuffs 225 cartons to plan, then closes the doors on the load. The
    near wall and roof stay faded to lines so the load remains visible. The
    drawing moves only with the scroll: it
    has no clock and no loop. Under reduced motion each of the four steps settles
    on one frame (`reducedMotionProgress`) instead of moving continuously, and the
    caption crossfade uses `motion-reduce:transition-none`. The server renders a
    line drawing of the landed container, and WebGL replaces it only where
    WebGL 2 runs well.
- One signature motion moment per viewport (e.g. the trade-network route drawing, the services crossfade, precision counter increments) rather than noisy repeated animations.

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
      Was 83 failing elements (worst 2.02:1); now 0. Re-measured after the
      gold palette and the homepage polish (2026-09-14): 0 failures across
      607 text elements on six pages, including the 404. That run caught the
      404 badge, gold on a 30% kraft wash at 4.44:1; the wash is now 15%.
- [x] Text over the photo heroes on `/` and `/trade-services`, at 1440px and
      390px: measured from pixels, because the solid sweep cannot score a
      photograph. Each hero is captured with its text made transparent, then
      every text element is scored against the darkest and the lightest pixel
      behind its box. Below `lg` both heroes use a flat 95% background wash,
      since the text runs across the whole photograph there, and the homepage's
      gold light behind the copy is desktop only for the same reason. The
      Trade Services hero also turns solid along its bottom 10%, where the
      footnote sits over the dark corner of the image. Before those changes, 8
      elements failed, the worst at 1.07:1; re-measured after the gold
      palette and the new assurance chips, none fail.
- [x] Hover labels on `InteractiveHoverButton`: white on the logo-navy fill
      that grows on hover, 15.3:1 computed from the tokens. At rest the white
      copy is transparent, so a resting-state scan misreads it as white on the
      button colour.
- [x] No scrollbar gutter on desktop: at 1440px `innerWidth - clientWidth` is
      0, the floating thumb tracks the scroll (4px from the top of the window
      at the top of the page, 398px at mid-page), and a 390px touch emulation
      renders no thumb.
- [x] `prefers-reduced-motion` honoured by every animation source listed in
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
