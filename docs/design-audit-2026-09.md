# CarrotCave visual audit — 2026-09

## Scope
Homepage archive, article reader, and Voices/category surfaces; preserve public content, local X media fallback, and footer rabbit v2.

## Goals
1. Refined minimal editorial archive: reduce competing chrome and let titles lead.
2. Clear hierarchy/navigation: measured header and axis rail with explicit active/focus states.
3. Consistent reading width and typography: one 1100px archive measure and 680px reader measure.
4. Calm surfaces: graphite/paper palette, restrained borders, orange carrot accent.
5. Accessible interaction: visible keyboard focus, readable muted text, reduced-motion support.
6. Responsive integrity: 390px remains single-column with no horizontal overflow.
7. Meaningful motion only: subtle card lift and preserved playful footer rabbit.

## Findings → decisions
- Existing CSS had many successive overrides; final contract is appended to avoid risky content/component churn.
- Archive cards had large title competition; narrow desktop title scale and unified spacing.
- Mobile navigation needed a stable measured rail; retained existing semantic links and made the surface calmer.
- Reader already has a strong measure; standardized vertical rhythm and action affordances.
- Footer rabbit and media components are preserved unchanged.

## Boundaries
No content rewrite, Telegram synchronization, data schema changes, or media fallback changes.

## Verification plan
Run focused DOM/CSS regression checks, `npm test`, `npm run build`, then production Playwright checks at 390/1280 for `/`, `/voices`, and one article route including overflow, navigation, media, footer, and reduced motion.

## Live audit note
The browser harness was unavailable during initial audit (`daemon carrot-audit didn't come up`); production proof is therefore a required final gate rather than inferred from source.
