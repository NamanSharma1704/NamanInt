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
figures and thin lines. There are no navy or grey bands: sections alternate between white and a warm ivory. Both golds were brightened a step later the same day, at the user request, when the first pair (#D1A03D fill, #855D19 ink) looked a little dark.

| Role | Token / HSL | Hex Equivalent | Description |
| :--- | :--- | :--- | :--- |
| **Primary** | `hsl(216 70% 16%)` | `#0C2549` | The logo navy. Navy buttons, button labels on gold, and the fill a hover button grows into. |
| **Accent** | `hsl(42 75% 57%)` | `#E4B23F` | Bright gold. Primary buttons, active fills, goods in the route drawing. Navy text on it (`--accent-foreground`) is 8.0:1; white measures only 2.0:1, so never white. |
| **Accent hover** | `hsl(41 66% 50%)` | `#D49E2B` | Hover and pressed gold; navy text 6.5:1. |
| **Accent on tint** | `hsl(39 72% 33%)` | `#916618` | Gold ink for text and thin lines: links, icons, stat figures, rules, rails, selected borders, focus rings, drawing highlights. 5.1:1 on white, 4.8:1 on ivory, 4.6:1 on a 10 to 15% gold tint. This is the brightest ink that still holds 4.5:1 on those tints. |
| **Gold** | `hsl(39 72% 33%)` | `#916618` | The same ink under its own name, for eyebrow labels and their rules, mono index numbers, the network spine and the sign-off lines in the route drawing. |
| **Gold soft** | `hsl(40 45% 76%)` | `#DDCBA6` | Kraft champagne: the cartons in the container drawing and the 404 badge wash (ink on a 15% wash, 4.8:1). Never text. |
| **Accent on dark** | `hsl(44 85% 68%)` | `#F3CE68` | Kept for a navy surface should one return. |
| **Accent tint** | `hsl(42 75% 57% / 0.06–0.28)` | Gold wash | Selection (28%), the NAMAN comparison column (6%), active mobile nav and icon chips (10%). |
| **Background** | `hsl(0 0% 100%)` | `#FFFFFF` | White page, header, photo-hero overlays. |
| **Card** | `hsl(0 0% 100%)` | `#FFFFFF` | White bands, the raised closing CTA panel. |
| **Muted surface** | `hsl(42 50% 97%)` | `#FBF9F4` | Warm ivory alternating bands (governance, services, office and timeline sections) and the footer. |
| **Text foreground** | `hsl(220 45% 11%)` | `#0F1829` | Ink navy; 16.9:1 on ivory. |
| **Muted text** | `hsl(218 15% 40%)` | `#576275` | Slate supporting text. 6.2:1 on white, 5.9:1 on ivory, 5.9:1 on the NAMAN column. |
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
  - Scrollbars: native scrollbars are hidden everywhere (`scrollbar-width: none` and `::-webkit-scrollbar { display: none }`), and `ScrollIndicator` (mounted in `RootLayout`) draws a slim gold thumb along the right edge in their place. It is hidden at rest and revealed by every scroll event, in either direction and from any source (wheel, trackpad, touch, keyboard, scripted), then fades out 850ms after the last one. The reveal slides in 6px and fades up over 200ms; the exit eases out more slowly over about 400 to 500ms. The thumb is 4px wide with round ends, in `--accent` with a hairline of gold ink so it holds an edge on white, ivory and photographs, and no glow. On mouse and trackpad screens, hovering the right edge reveals it, shows a faint track, widens the thumb to 6px and lets it be dragged; on touch screens it is display only. Position is a per-frame transform and height is measured only on resize, so it causes no layout work or shift. It is `aria-hidden`, renders nothing on the server, hides on pages that do not scroll, and drops the slide under reduced motion.
  - Caret: The gold ink, `--accent-on-tint`.
  - Favicon: the favicon.io set in `public/assets/images/favicon_io` (multi-size ICO, 16px and 32px PNGs, a 180px Apple touch icon, and 192px and 512px icons in `site.webmanifest`), linked from `index.html` with a white `theme-color`. A copy of the ICO sits at `/favicon.ico` for clients that request that path directly; it replaced an SVG placeholder that only carried the .ico name.
- **Homepage depth**: the first page polished under the current palette. Glass assurance chips under the hero actions; a faint gold light behind the hero copy, desktop only, because below `lg` the copy crosses the photograph; gold-ink metric figures; a raised, rounded image stage in the services sequence; gold icon chips and figures on the audience panels; bright gold goods with gold-ink sign-off lines in the route drawing; and a raised closing CTA panel with a bright-to-deep gold rule along its top edge.
- **Trade Services depth**: the second page polished. The four headline figures sit on a raised panel that overlaps the hero's lower edge, and on phones the hero footnote joins the page flow, where it used to collide with the links. The discipline photograph is a raised stage with nothing laid over it (its number-and-name caption was removed, as on Categories, because the tab and heading already name the discipline), and each deliverable carries a gold check chip. The governance comparison is one raised panel: the NAMAN column has a bright gold header with navy text, a gold wash and gold check marks, and the alternatives get tinted red and amber marks. The configurator sits on the ivory band with white option cards; the selected card has a gold ring, a check and `aria-pressed`, and the summary is a raised panel with a gold primary button. The summary is deliberately not sticky, because it is nearly as tall as the options and could only travel about 70px. The page closes on the same raised CTA panel as the homepage.
- **Categories depth**: the third page polished. The hero stays text-led, so it is not a third copy of the photographic heroes, and from `lg` it gains a raised index of the five manufacturing portfolios: each row shows the lead time and opens that category in the portfolio section, scrolling it into view. The proof figures sit on a raised panel overlapping the hero, with each label ahead of its figure in the markup. The portfolio photograph is a raised stage with nothing laid over it (a number-and-name caption was removed because it only repeated the selected tab and the label beside the photo); the specification sits in one ivory block, and inspection protocols carry gold check chips. The four governance checkpoints are raised white cards on the ivory band with gold numbered badges, and the page closes on the shared raised CTA panel. No photographs were added or moved, so the CDN-served category photographs appear only where they already did. Each category with an inspection model (so far Precision Hardware and Packaging & Retail) has a "Photograph / Inspection process" switch under its photograph, offered only where WebGL 2 runs well. Inspection process replaces the whole panel with the inspection view: a hidden-line model in the photograph's 4:3 frame, half the panel's width and never taller than the screen allows, pinned beneath the header beside a process panel (the category label, an Inspection process heading, the step list on a gold progress rail, and the current step's caption). The title, description, specification and inquiry link step aside until Photograph is chosen again, and switching views scrolls the panel into place, so the process starts at its first step. Scrolling then moves through the category's three protocols: the model turns toward each inspection point, that step's gold effect plays out with the scroll, its numbered point comes forward and its caption crossfades in, and any step can be chosen from the list. On phones the step list becomes three step bars under the drawing. Leaving the category returns the panel to the photograph. The Packaging model is rebuilt with img2threejs from the owner's illustration (used as a modelling reference only, never published, because it carries baked-in text and invented dimension figures), and the drawings are labelled "Illustrative drawing, not to scale" because the Packaging carton is drawn smaller than in the illustration so it fits over the tray.
- **Company depth**: the fourth page polished. The hero stays text-led and from `lg` gains a raised panel of the four regional desks, each showing its local time and linking to that office below. The clocks fill in after mount, so the server markup carries `--:--` and cannot mismatch; the panel states no office hours, since the site does not publish any. The figures sit on a raised panel overlapping the hero, and the office directory is one raised panel with index numbers and gold role badges. The timeline is a connected rail, vertical on phones and horizontal from `lg`, with gold markers and the latest milestone marked current. The charter is four raised cards with gold icon chips, and the page closes on the shared CTA panel.
- **In-page links**: `#id` links scroll through `followInPageLink` in `src/lib/in-page-link.ts`, used by `Link001` and the Company desk links. A plain hash link updated the address but did not scroll, most likely because the router restores the scroll position on a hash change. The helper scrolls in code, moves focus to the target (give it `tabIndex={-1}` unless it is focusable), keeps the hash in the address, drops smooth scrolling under reduced motion, and leaves modified clicks to the browser. It also fixed Explore Core Disciplines on Trade Services, which had never scrolled.
- **Contact depth**: the fifth and last page polished. The hero keeps its copy and adds the two ways in: a gold Start your inquiry button that jumps to the form, and from `lg` a raised Direct lines panel with email, the Shenzhen and Hong Kong phone line, a link to the regional desks and the NDA confidentiality note. The four commitments sit on a raised panel overlapping the hero, each with a gold icon chip. The inquiry section runs on the ivory band: intent options are selectable cards with a gold ring and check, a three-step What happens next list restates the reply the hero promises, and the form sits in a raised white panel with a gold primary submit button. Required asterisks are decorative, since each input carries `required`; a note appears when fields arrive prefilled from the configurator or a category link; and the error and success messages sit inside an always-present live region so they are announced. The submit handler, payload, field names and prefill logic are unchanged. The left column is no longer sticky: it never pinned under the old `overflow-hidden` main, and it is now taller than the form. Offices are four raised cards.

---

## 5. Motion & Micro-Interactions

- Powered by `motion/react` with spring/cubic-bezier curves (`[0.16, 1, 0.3, 1]`).
- Duration: 150ms–300ms for interface feedback; 600ms–800ms for viewport entry reveals.
- Respects `prefers-reduced-motion`. Because the motion here comes from eight
  independent systems, the preference has to be honoured in eight places:
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
  - The Categories inspection processes (`src/components/category-inspection`,
    with the shared renderer and scroll hook in
    `src/components/inspection-drawing`, and each drawing's model and effects in
    `src/components/housing-inspection` and
    `src/components/packaging-inspection`): a category's figure switched to
    Inspection process pins beneath the header and scrolls through its three
    protocols. Scroll progress turns the hidden-line model toward each
    inspection point and plays out that step's drawn effect: a CMM probe, a
    screening plane and salt spray on the housing; the carton lowered onto its
    corner, compression arrows and a barcode scan on the display. As in the
    container sequence, the drawing moves with the scroll; its only clock is a
    slight idle sway, which stops off screen. Under reduced motion each step
    settles on its middle frame, the sway never runs, and the photograph
    crossfade and caption crossfade use `motion-reduce:transition-none`. The
    switch is offered only where WebGL 2 runs well, so the server and other
    browsers show the photograph and protocol list. Three.js loads when
    Inspection process is chosen, and leaving the category returns to the
    photograph and releases the WebGL context. Both drawings share one geometry
    vocabulary (`src/lib/inspection-drawing/solids.ts`).
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
  - The scroll indicator (`src/components/ScrollIndicator.tsx`): its reveal
    slides in and fades; `motion-reduce:translate-x-0` removes the slide, so
    under reduced motion it only fades, and the thumb width change loses its
    transition.
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
- [x] Scroll indicator (2026-09-14), measured in Chrome: hidden at rest, with no
      gutter and no horizontal overflow. The thumb position matched scroll
      progress to the pixel after wheel scrolling down and up, PageDown,
      scripted scrolling, dragging and phone touch. Timed inside the page: 73%
      visible at 100ms, fully visible by about 175ms, held until the 850ms
      delay ran out, fading from about 925ms and gone by about 1,325ms.
      Hovering the edge widened it to 6px and kept it up; dragging it 120px
      scrolled the page 1,033px; on a phone it showed during a touch drag and
      took no pointer input. With the native scrollbars hidden, the wheel,
      PageDown, End, Space and touch all still scrolled the page.
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
