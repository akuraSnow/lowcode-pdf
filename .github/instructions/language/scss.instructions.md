---
applyTo: '**/*.scss'
---

# SCSS Best Practices

Use this checklist when writing or reviewing SCSS.

## 1. Structure & Naming
- Organize by feature/component; keep shared tokens/utilities in dedicated files.
- Use `kebab-case` for class/file/folder names; follow BEM (or agreed convention).

## 2. Layout & Responsiveness
- Prefer Flexbox/Grid for layout; use media queries for breakpoints.
- Use logical properties (`margin-inline`, `padding-block`, etc.) for i18n-friendly layouts.

## 3. Variables & Tokens
- Use CSS variables (custom properties) for theme/reused values; avoid magic numbers.
- Centralize z-index and spacing scales; avoid ad-hoc values.

## 4. Selectors & Modern Features
- Use modern selectors (`:is`, `:where`, `:has` where supported); keep nesting shallow.
- Avoid deprecated/obsolete properties; keep selectors concise and specific enough.

## 5. Assets & Files
- Name assets in lowercase with hyphens/underscores as needed; use web-safe formats.
- Remove unused variables, mixins, imports to keep the bundle clean.

## 6. Effects & Performance
- Use transitions/animations sparingly; prefer GPU-friendly properties (transform/opacity).
- Add `will-change` only when measured helpful; avoid layout thrashing.
