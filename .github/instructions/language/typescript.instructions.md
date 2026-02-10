---
applyTo: '**/*.ts, **/*.d.ts'
---

# TypeScript Best Practices

Use this checklist when writing or reviewing TypeScript in React projects.

## 1. Core Typing
- Prefer `const` over `let`; avoid `var`.
- Explicitly type function params/returns when not obvious; rely on inference for simple locals.
- Avoid `any`; if unavoidable, wrap with TODO and scope narrowly. Prefer `unknown` + type guards.
- Use interfaces for object shapes; `type` for unions/intersections. Mark fields `readonly` where applicable.
- Use literal unions/enums for fixed sets; discriminated unions for variant handling.
- Apply type guards/narrowing; avoid non-null assertions unless justified.
- Use generics for reusable helpers; keep them as simple as possible.
- Leverage utility types (e.g., `Partial`, `Pick`, `Omit`, `Record`) instead of ad-hoc remapping.

## 2. Modules & Imports
- Use ES modules only; avoid `require`/namespace imports.
- Prefer type-only imports/exports (`import type`, `export type`) to reduce runtime weight.
- Align with project `tsconfig` targets and path aliases; avoid relative path spaghetti when aliases exist.

## 3. Async & Errors
- Type async functions as `Promise<T>`; handle errors explicitly (no silent `catch` without action).
- Prefer `fetcher`/shared HTTP utilities; keep response types defined and reused.

## 4. Classes (when used)
- Use access modifiers intentionally; prefer composition over deep inheritance.
- Mark fields `readonly` when immutable; avoid public mutation unless necessary.

## 5. Safety & Hygiene
- Avoid deprecated/obsolete TS/JS features; use modern syntax (async/await, optional chaining `?.`, nullish coalescing `??`).
- Remove unused types/imports; keep files lean. Avoid `eval` and dynamic `Function`.
