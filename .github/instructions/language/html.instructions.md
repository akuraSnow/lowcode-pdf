---
applyTo: '**/*.html'
---

# HTML Best Practices

Use this as a quick checklist when authoring or reviewing HTML.

## 1. Semantics & Structure
- Prefer HTML5 semantic elements (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `search`).
- One primary `h1` per page; maintain heading hierarchy (`h2`/`h3`...).
- Use lists (`ul/ol`) for grouped items; tables only for tabular data.
- Avoid deprecated/obsolete tags; keep tag/attribute names lowercase.
- Group related form controls with `fieldset` + `legend` when appropriate.

## 2. Accessibility
- Provide text alternatives for media (`alt` on `img`; captions for video/audio).
- Ensure form controls have associated labels; use `aria-*` only when native semantics are insufficient.
- Manage focus order; ensure keyboard operability for interactive elements.
- Use appropriate landmarks (`main`, `nav`, `header`, `footer`) for screen readers.

## 3. Performance & Responsiveness
- Add `loading="lazy"` to non-critical images/iframes; prefer modern formats (WebP/AVIF) when available.
- Include responsive meta viewport; design mobile-first with fluid layouts.
- Defer or async non-critical scripts when possible.

## 4. Forms & Inputs
- Use proper input types (`email`, `tel`, `number`, `date`) for validation and mobile keyboards.
- Provide helpful `placeholder` sparingly; never replace labels with placeholders.
- Use `required`, `min`, `max`, `pattern`, and `autocomplete` where applicable.

## 5. SEO & Metadata
- Provide unique, descriptive `<title>` and `<meta name="description">` per page.
- Use canonical links when necessary; include language (`lang`) on the root element.

## 6. Internationalization Hooks
- Avoid hardcoded UI text in HTML; source strings from localization files/messages.
- Do not embed HTML tags inside localized default messages unless they are approved placeholders.
