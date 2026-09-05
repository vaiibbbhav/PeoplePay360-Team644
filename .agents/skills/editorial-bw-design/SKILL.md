---
name: editorial-bw-design
description: Design system for PeoplePay360. Editorial monochrome with Playfair Display serif headlines, IBM Plex Sans body, hairline borders, and single violet accent (#6A3FA0).
---

# Editorial Black & White Design Skill

## 1. Tokens & Color Palette
- Light mode (default):
  - `--bg`: `#FAFAF8`
  - `--bg-raised`: `#F1EFEA`
  - `--ink`: `#131211`
  - `--ink-soft`: `#55524C`
  - `--line`: `#DEDAD1`
  - `--accent`: `#6A3FA0`
  - `--accent-ink`: `#FFFFFF`
  - `--accent-soft`: `#EDE4F7`
  - `--over-red`: `#A4483B`
- Dark mode (`html.dark`):
  - `--bg`: `#0C0B0D`
  - `--bg-raised`: `#17151A`
  - `--ink`: `#F3F1EC`
  - `--ink-soft`: `#A6A29B`
  - `--line`: `#2B2831`
  - `--accent`: `#B08FE0`
  - `--accent-ink`: `#0C0B0D`
  - `--accent-soft`: `#241E33`
  - `--over-red`: `#D97C6C`

## 2. Typography
- **Headlines:** `Playfair Display`, serif (weight 500, 600, 700). Applied to `h1`, `h2`, `h3`, wordmark.
- **Body & Controls:** `IBM Plex Sans`, sans-serif (weight 400, 500, 600). Used for all body text, labels, inputs, buttons, and tables.
- **Rules:** No all-caps labels. No monospace except for raw IDs if strictly needed.

## 3. Elevation & Surfaces
- Flat elevation: 1px hairline borders (`var(--line)`).
- **NO drop shadows, NO gradient cards.**
- Buttons: Primary uses `var(--accent)` with `var(--accent-ink)`. Ghost uses transparent background with `var(--line)` border.

## 4. Implementation with Tailwind CSS
- ALWAYS use Tailwind CSS utility classes (`className="..."`).
- NEVER use inline styles (`style={{ ... }}`) or vanilla CSS classes unless strictly required for dynamic calculations.
- Use utility tokens: `bg-bg`, `bg-bg-raised`, `text-ink`, `text-ink-soft`, `border-line`, `text-accent`, `bg-accent`, `bg-accent-soft`, `text-over-red`, `font-serif`, `font-sans`.

