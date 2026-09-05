# PeoplePay360 / DealFlow360 — Design System

A minimal, editorial black-and-white UI with a single violet accent, built around one distinctive move: **Playfair Display serif headlines set against a plain, technical sans body** — the same contrast the product itself lives in, between an operational governance decision (an approval, an override, a validation warning) and routine administration (a line item, a check-in timestamp).

---

## 1. Design Principles

1. **Restraint carries the accent.** Violet appears only where a decision or an active state lives — a link, a button, a dot, a bar, a flagged line. It is never used for decoration or to fill space.
2. **One serif moment, not a serif habit.** Playfair Display is reserved for headlines (`h1`, `h2`, `h3`, the wordmark) and the single italic callout in the risk section. Labels, captions, and repeated micro-copy (like flow-step names) stay in the sans body face (`IBM Plex Sans`).
3. **No shadows, no gradients, no rounded-card sameness.** Hierarchy comes from borders, whitespace, and type weight — not elevation.
4. **Sequence gets a diagram; everything else gets a sentence.** Numbered/lettered markers are used only for true sequences (e.g. the employee-to-payslip flow).
5. **Motion answers an action.** The only interactive transitions are the theme toggle and hover states — no on-scroll reveals, no staggered fade-ins.

---

## 2. Color System

Colors are defined as CSS custom properties on `:root`, overridden on `html.dark`. Nothing is hardcoded in components — every surface, border, and text color references a token.

### Light mode (default)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#FAFAF8` | Page background |
| `--bg-raised` | `#F1EFEA` | Panels one step above the page: hero diagram, module backgrounds, risk card |
| `--ink` | `#131211` | Primary text, headlines |
| `--ink-soft` | `#55524C` | Secondary text, body copy, captions |
| `--line` | `#DEDAD1` | All borders, dividers, table rules |
| `--accent` | `#6A3FA0` | Links, buttons, active dots, bar fills, flagged states |
| `--accent-ink` | `#FFFFFF` | Text/icon color placed on top of `--accent` |
| `--accent-soft` | `#EDE4F7` | Accent-tinted fills (badges, selected rows) |
| `--over-red` | `#A4483B` | The single semantic exception — an anomaly, validation warning, or over-limit state |

### Dark mode

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0C0B0D` | Page background — near-black, not pure black |
| `--bg-raised` | `#17151A` | Raised panels |
| `--ink` | `#F3F1EC` | Primary text — warm off-white, not pure white |
| `--ink-soft` | `#A6A29B` | Secondary text |
| `--line` | `#2B2831` | Borders, dividers |
| `--accent` | `#B08FE0` | Lightened violet — kept legible at low luminance |
| `--accent-ink` | `#0C0B0D` | Text on top of accent buttons |
| `--accent-soft` | `#241E33` | Accent-tinted fills |
| `--over-red` | `#D97C6C` | Lightened warning red |

---

## 3. Typography

- **Display / headline:** `Playfair Display` (500/600/700, plus italic 500) — serif, high-contrast strokes, used for `h1`, `h2`, `h3`, and the wordmark.
- **Body / UI:** `IBM Plex Sans` (400/500/600) — a technical, slightly geometric grotesque that reads as operational software rather than marketing gloss. Used for everything else: paragraphs, labels, nav, buttons, list items, captions.
- **Rules:**
  - **No all-caps labels anywhere.** Section labels, tags, and captions are sentence case at reduced size and weight.
  - Line length is held under 56 characters for section intros and under 46 for body paragraphs.

---

## 4. Spacing & Elevation

- **Content container:** `max-width: 1120px`, centered, `32px` horizontal padding (`20px` on mobile).
- **Section rhythm:** `84px` top/bottom padding on desktop, `56px` on mobile.
- **Hairline Rule:** Avoid drop shadows. Surfaces and cards are separated by a flat 1px `--line` border.

---

## 5. Implementation Standard: Strict Tailwind CSS Usage

- **Rule:** Always use Tailwind CSS utility classes (`className="..."`) for all UI styling.
- **Rule:** Never use inline CSS (`style={{ ... }}`) or custom vanilla CSS classes unless an extreme dynamic runtime calculation requires it.
- **Utility Tokens:**
  - Backgrounds: `bg-bg`, `bg-bg-raised`
  - Text: `text-ink`, `text-ink-soft`
  - Borders: `border-line`, `border-accent`
  - Accent Fills: `bg-accent`, `bg-accent-soft`
  - Fonts: `font-serif` (Playfair Display), `font-sans` (IBM Plex Sans)

