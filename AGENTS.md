# Antigravity Instructions for NAMAN INTERNATIONAL LTD

## Mandatory Design Frameworks: UI/UX Pro Max, Impeccable & Taste Skill

Whenever designing, creating, refactoring, or reviewing any user interfaces, pages, components, or styling in this repository, **ALWAYS** combine and apply the principles from:
1. **UI/UX Pro Max**: [`.agent/skills/ui-ux-pro-max/SKILL.md`](file:///d:/Project/NAMAN_INTERNATIONAL_LTD/.agent/skills/ui-ux-pro-max/SKILL.md)
2. **Impeccable (Worlds & Anti-Slop)**: [`.agent/skills/impeccable/SKILL.md`](file:///d:/Project/NAMAN_INTERNATIONAL_LTD/.agent/skills/impeccable/SKILL.md) & [Visual Worlds (`impeccable.style/#worlds`)](https://impeccable.style/#worlds)
3. **Taste Skill Suite**:
   - [**`taste-skill`**](file:///d:/Project/NAMAN_INTERNATIONAL_LTD/.agent/skills/taste-skill/SKILL.md): Brief inference ("Design Read"), 3 Dials (`DESIGN_VARIANCE`, `MOTION_INTENSITY`, `VISUAL_DENSITY`), Anti-default discipline.
   - [**`redesign-skill`**](file:///d:/Project/NAMAN_INTERNATIONAL_LTD/.agent/skills/redesign-skill/SKILL.md): Audit-first workflow for existing pages.
   - [**`soft-skill`**](file:///d:/Project/NAMAN_INTERNATIONAL_LTD/.agent/skills/soft-skill/SKILL.md) / [**`minimalist-skill`**](file:///d:/Project/NAMAN_INTERNATIONAL_LTD/.agent/skills/minimalist-skill/SKILL.md): High-end, premium restraint and editorial rhythm.
   - [**`output-skill`**](file:///d:/Project/NAMAN_INTERNATIONAL_LTD/.agent/skills/output-skill/SKILL.md): Complete, production-grade output (no placeholder comments or skipped code).

---

### Core Philosophy: Authentic Visual Worlds & Anti-Slop Discipline

- **The One-Line Design Read**: Before generating code, state the design read:
  > *"Reading this as: [page kind] for [audience], with a [vibe] language, leaning toward [design system / visual world]."*
- **Set the Three Dials**:
  - `DESIGN_VARIANCE` (1–10): Layout experimentation (asymmetry, custom rhythm).
  - `MOTION_INTENSITY` (1–10): Animation depth (subtle hover to cinematic scroll).
  - `VISUAL_DENSITY` (1–10): Information per viewport (spacious vs. compact operational).
- **Anti-Default Discipline**:
  - Reject generic AI templates (nested cards-in-cards, generic glassmorphism on everything, centered hero over dark mesh, status-chip soup).
  - Refuse eyebrow/kicker crutches: Let primary headings carry their own authority.
  - Refuse text gradients: Express emphasis through weight, scale, and typographic contrast.
  - Hard em-dash ban: Replace lazy em-dashes with clean punctuation or intentional phrasing.
- **The Impeccable Craft Floor**:
  - Contrast ≥ 4.5:1 for body and controls in both light and dark themes.
  - Exclusively use crisp SVG icons from `lucide-react` (never raw emojis as UI icons).
  - Theme browser surfaces (`::selection`, scrollbars, focus rings) to match the brand palette.
  - Smooth, non-layout-shifting interactive feedback (`cursor-pointer` on all clickable cards and buttons).

---

### Workflow & Commands

1. **Shape & Audit (`/shape` & `redesign-skill`)**:
   - For new work: Clarify audience mode (**Persuade**, **Operate**, or **Read**).
   - For existing pages: Audit current typography, layout, spacing, and contrast before modifying.

2. **Design System & Visual World**:
   - Deep Maritime Navy (`#0B192C`), Slate (`#1E293B`), Warm Gold / Amber (`#D97706`), or Ocean Cobalt (`#1D4ED8`) accents.
   - Typography pairings with authoritative hierarchy (Albert Sans / Inter for UI; distinctive display when appropriate).
   - Responsive containers (`max-w-7xl`) with clean vertical rhythm and breathing room.

3. **Refine & Polish Playbooks**:
   - **`/polish`**: Final quality pass ensuring micro-alignment, consistent padding, and zero layout shifts.
   - **`/distill`**: Strip away unnecessary cards and decorative noise to let the core data lead.
   - **`/clarify`**: Make CTAs, inputs, and trade value propositions crystal clear.
   - **`/animate`**: Smooth micro-interactions (150ms–300ms) with `motion/react`, respecting `prefers-reduced-motion`.

---

### Pre-Delivery Checklist
- [ ] Stated the one-line "Design Read" and dial settings.
- [ ] No emoji icons used in place of SVG icons.
- [ ] All interactive cards, rows, and buttons have `cursor-pointer` and stable hover feedback.
- [ ] Zero horizontal scroll at 375px, 768px, 1024px, and 1440px.
- [ ] Full code output with zero placeholder comments or omitted sections (`output-skill`).
- [ ] Contrast ratio ≥ 4.5:1 for body and controls in both light and dark modes.
