# DealFlow360 — Design System

A minimal, editorial black-and-white UI with a single violet accent, built around one distinctive move: **Playfair Display serif headlines set against a plain, technical sans body** — the same contrast the product itself lives in, between a considered decision (an approval, a discount ceiling) and a routine one (a line item, a status).

---

## 1. Design Principles

1. **Restraint carries the accent.** Violet appears only where a decision or an active state lives — a link, a button, a dot, a bar, a flagged line. It is never used for decoration or to fill space.
2. **One serif moment, not a serif habit.** Playfair Display is reserved for headlines and the single italic callout in the risk section. Labels, captions, and repeated micro-copy (like flow-step names) stay in the sans body face — a serif label repeated across every card reads as a template tic, not a typographic decision.
3. **No shadows, no gradients, no rounded-card sameness.** Hierarchy comes from borders, whitespace, and type weight — not elevation.
4. **Sequence gets a diagram; everything else gets a sentence.** Numbered/lettered markers are used only for the one genuine sequence (the quotation-to-reporting flow). Nothing else is artificially numbered.
5. **Motion answers an action.** The only interactive transitions are the theme toggle and hover states — no on-scroll reveals, no staggered fade-ins.

---

## 2. Color System

Colors are defined as CSS custom properties on `:root`, overridden on `html.dark`. Nothing is hardcoded in components — every surface, border, and text color references a token.

### Light mode (default)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#FAFAF8` | Page background |
| `--bg-raised` | `#F1EFEA` | Panels one step above the page: hero diagram, module list backgrounds, risk card |
| `--ink` | `#131211` | Primary text, headlines |
| `--ink-soft` | `#55524C` | Secondary text, body copy, captions |
| `--line` | `#DEDAD1` | All borders, dividers, table rules |
| `--accent` | `#6A3FA0` | Links, buttons, active dots, bar fills, flagged states |
| `--accent-ink` | `#FFFFFF` | Text/icon color placed on top of `--accent` |
| `--accent-soft` | `#EDE4F7` | Reserved for accent-tinted fills (badges, selected rows) |
| `--over-red` | `#A4483B` | The single semantic exception — an over-limit discount line |

### Dark mode

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0C0B0D` | Page background — near-black, not pure black |
| `--bg-raised` | `#17151A` | Raised panels |
| `--ink` | `#F3F1EC` | Primary text — warm off-white, not pure white |
| `--ink-soft` | `#A6A29B` | Secondary text |
| `--line` | `#2B2831` | Borders, dividers |
| `--accent` | `#B08FE0` | Lightened violet — kept legible at low luminance rather than reusing the light-mode accent |
| `--accent-ink` | `#0C0B0D` | Text on top of accent buttons |
| `--accent-soft` | `#241E33` | Accent-tinted fills |
| `--over-red` | `#D97C6C` | Lightened warning red, same logic as the accent |

**Rules:**
- Never pair `--ink` text on `--bg-raised` at less than body-text size without checking contrast — both are close in value by design (subtle elevation), so small/light text needs `--ink-soft` or larger weight to stay legible.
- The accent is never used as a full-bleed background for large areas — only for buttons, dots, thin bars, and 1–2px rules. Backgrounds stay neutral.
- `--over-red` is the only additional hue in the entire system. It appears exactly once in concept (an over-limit discount) and should not be reused for generic "error" states elsewhere without reconsidering whether that state is truly the same category of problem.
- Dark mode is not an inverted filter — every token was independently tuned (warmer off-black, warmer off-white, lightened accent) rather than auto-inverted, so contrast and mood hold in both modes.

---

## 3. Typography

### Families

- **Display / headline:** `Playfair Display` (500/600/700, plus italic 500) — serif, high-contrast strokes, used for `h1`, `h2`, `h3`, the wordmark, and the single risk-section callout.
- **Body / UI:** `IBM Plex Sans` (400/500/600) — a technical, slightly geometric grotesque that reads as operational software rather than marketing gloss. Used for everything else: paragraphs, labels, nav, buttons, list items, captions.

Two families only. No monospace anywhere — the product has no code-like data (no IDs, no raw numbers needing tabular alignment) that would justify one.

### Type scale

| Role | Size | Weight | Family | Line-height | Notes |
|---|---|---|---|---|---|
| Hero H1 | 58px / 38px mobile | 600 | Playfair Display | 1.12 | Max-width 15ch so it wraps deliberately |
| Section H2 | 34px | 600 | Playfair Display | 1.12 | Max-width 56ch alongside its supporting line |
| Sub H2 (CTA) | 32px | 600 | Playfair Display | 1.12 | |
| Module H3 | 22px | 600 | Playfair Display | 1.12 | |
| Risk callout | 18px, italic | 500 | Playfair Display | 1.4 | The one intentional italic serif moment in the page |
| Wordmark | 21px | 700 | Playfair Display | 1 | "360" set in accent color, not italic or bold-only tricks |
| Body / hero sub | 16–17.5px | 400 | IBM Plex Sans | 1.6 | Max-width ~46ch |
| List item / card text | 14–15.5px | 400 | IBM Plex Sans | 1.5 | |
| Label / caption / eyebrow-equivalent | 13–13.5px | 500–600 | IBM Plex Sans | 1.4 | Sentence case, never uppercase or letter-spaced |
| Micro (footer, status) | 12.5–14px | 400 | IBM Plex Sans | 1.4 | |

### Rules

- **No all-caps labels anywhere.** Section labels, tags, and captions are sentence case at reduced size and weight instead.
- **No single-word accent styling inside a headline** (no bolding or italicizing one word for emphasis) — the one exception is the hero's `.accent-word` span, which is a deliberate, singular color treatment used exactly once per page, not a repeated device.
- Small structural labels (flow-step names, module pane tags, problem-column titles) are sans-serif, colored with `--accent`, at 13px/600 — **not** Playfair italic. This was a direct fix from an earlier draft: repeating the serif-italic treatment on every small label diluted it into a template tic instead of a considered accent.
- Serif italic is reserved for exactly one place: the risk-section callout, where it functions as a pull-quote, not a label.
- Line length is held under 56 characters for section intros and under 46 for body paragraphs.

---

## 4. Spacing & Layout

### Grid

- Content container: `max-width: 1120px`, centered, `32px` horizontal padding (`20px` on mobile).
- Section vertical rhythm: `84px` top/bottom padding on desktop, `56px` on mobile ≤860px.
- Sections are separated by a single `1px` `--line` border — no shadow, no background-color banding between sections.

### Section-internal spacing

| Element | Value |
|---|---|
| Section head → content | 48px |
| Section head heading → supporting line | 14px |
| Card internal padding (module pane) | 34px sides, 30–34px top/bottom |
| Card internal padding (risk card) | 28px |
| List item vertical padding | 13px, divided by 1px `--line` rules (not gaps/cards) |
| Grid gap, two-column layouts | 48–64px |
| Grid gap, module panes (hairline-divided) | 1px (the gap itself is the divider — background color shows through as the rule) |
| Button padding | 13px vertical, 22px horizontal |
| Nav vertical padding | 20px |

### Breakpoint

- Single breakpoint at `860px`. Below it: all multi-column grids collapse to one column (roles collapse to two), nav links hide, hero switches to single column with the diagram below the headline, and section padding reduces.

---

## 5. Borders, Radius & Elevation

- **No box-shadow anywhere in the system.** Elevation and grouping are communicated entirely through `1px solid var(--line)` borders and background-value steps (`--bg` vs `--bg-raised`).
- Radius is used sparingly and consistently: `14px` for panels/cards (hero diagram, module grid, flow strip, risk card, deliverables list), `8px` for buttons, `100px` (pill) for the theme toggle track, `50%` for the toggle knob and step dots.
- Nothing uses a shadow to fake depth — a raised panel is simply a different, slightly warmer/cooler background value than the page, edged with a hairline border.

---

## 6. Iconography & Markers

- No icon library. The only graphic marks are:
  - **Dots** (11px circle, 1.5px accent border, filled when a step is "reached") in the hero flow diagram.
  - **Thin rule connectors** between dots (1px, `--line`).
  - **Bar-limit ticks** (2px vertical mark) in the discount-risk bars, showing the allowed ceiling against the fill.
- No arrow glyphs appended to links or buttons ("→"). Buttons state the action in words only.

---

## 7. Components

### Navigation
Sticky, `blur(10px)` backdrop over a semi-transparent background (`color-mix` with the page background), bottom-bordered with `--line`. Wordmark in Playfair (with "360" in accent). Links in sans, `--ink-soft`, hover to `--ink` — no underline, no background pill.

### Buttons
Two variants only:
- **Primary:** solid `--accent` fill, `--accent-ink` text, no border.
- **Ghost:** transparent fill, `--line` border, `--ink` text.
No shadow, no scale-on-hover. Hover states shift only opacity/border color (see §8).

### Hero flow diagram
A vertical, connected-dot list inside a raised panel — the one diagrammatic element on the page, reused visually (in flatter form) as the horizontal flow-strip lower down. Filled dots indicate stages already covered by the product narrative; the last (unfilled) dot marks the outcome state.

### Module panes
Two-column, hairline-divided (`1px` gap on a `--line`-colored grid background, simulating a shared rule between panes). Each list item is a label (`--ink`, 500) plus a short description (`--ink-soft`), separated by top-border rules rather than card-in-card boxes.

### Discount-risk card
A raised panel containing per-line bars: track (`--line`), fill (`--accent`, or `--over-red` when over limit), and a tick mark showing the category ceiling. This is the only place in the UI where color (red) carries meaning beyond the accent — used exactly once, deliberately.

### Deliverables list
A bordered, raised list of label/value rows, right-aligned value text in `--ink-soft` — styled identically to the module-pane list pattern for consistency, not as a separate "card kit."

---

## 8. Animation & Interaction

The system uses motion only to respond to something the person just did — never on scroll, never staggered, never decorative.

| Interaction | Behavior |
|---|---|
| Theme toggle | Knob slides `18px` via `transform`, `0.25s ease`; page background/text/border colors cross-fade via `transition: background 0.35s ease, color 0.35s ease` on `body` |
| Link / nav hover | Instant color change, `--ink-soft` → `--ink` (no transition duration specified — treated as a state, not an animated event) |
| Anchor navigation | `scroll-behavior: smooth` on `html` for in-page jumps (Modules, Flow, Discount score, Roles) |
| Buttons | No hover animation beyond native browser focus/active states — kept deliberately quiet so the toggle remains the page's one "moment" |

**What this system explicitly avoids:** fade-and-slide-up section reveals, staggered card entrances, hover-lift/shadow-pop on cards, animated counters, parallax. If a future iteration wants one orchestrated moment, it should be a single page-load sequence (e.g., the hero dots filling in sequence once) — not a per-section pattern repeated throughout.

**Reduced motion:** all transitions above are cosmetic, not functional — wrap them in a
```css
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; scroll-behavior: auto !important; }
}
```
block so the page is fully usable and static for anyone who has that preference set.

---

## 9. Loaders & Skeletons

The current build is static and has no async data, so no loader exists yet — but if the workspace views (quotation builder, pipeline, dashboard) are built out, they should follow the same restraint:

- **No spinners.** A spinning icon is the one motif this system should never introduce — it clashes with the otherwise-still page.
- **Skeleton blocks**, not spinners, for loading content: flat rectangles at `--bg-raised` (a shade between page and content, matching the raised-panel token), same `14px`/`8px` radius as the real content they stand in for, with a slow (`1.8s`) opacity pulse between `1` and `0.6` — not a shimmering gradient sweep, which would introduce a gradient this system otherwise avoids.
- **Line-item loading** (e.g., pipeline cards, upsell suggestions streaming in) should reuse the existing hairline-divided list pattern with skeleton text bars in place of copy, so a loading pipeline looks like a lower-information version of the loaded one, not a different component.
- **Progress within a flow** (e.g., approval steps, fulfillment split calculating) should reuse the dot-and-line motif from the hero diagram: an unfilled dot pulses gently while its stage is in progress, then becomes solid — consistent with how "reached" stages are already shown statically.

---

## 10. Accessibility

- Text/background pairs are chosen to hold WCAG AA contrast in both themes — `--ink-soft` is deliberately warmer/lighter than a pure 50%-gray so it stays legible against both `--bg` and `--bg-raised`.
- Focus states: browser-native visible focus rings are preserved (never suppressed with `outline: none` without a replacement).
- Color is never the only signal: the over-limit discount line is marked with both `--over-red` and explicit text ("18% given, 10% allowed"), not color alone.
- Theme toggle has an `aria-label` ("Toggle dark mode") since it carries no text.

---

## 11. Dark Mode Strategy

Dark mode is applied via a single `html.dark` class (toggled by JS, defaulting to the visitor's `prefers-color-scheme`), overriding the same token set rather than maintaining separate component styles. Every rule in the system references a token, never a literal color — this is what makes the toggle a one-class operation instead of a duplicated stylesheet. When adding new components, the rule is simple: reach for a `var(--token)`, never a hardcoded hex, or the component will silently break in one of the two themes.
