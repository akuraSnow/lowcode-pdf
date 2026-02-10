# GitHub Copilot Instructions (Slim Reference)

This file removes duplicated content and defers to the canonical instruction sources in the repository. Use this as a concise entry point, then follow the linked standards exactly.

## Core Workflow (Non‑Negotiable)
- Step 1: Read standards
  - React Review: [.github/instructions/react/code-review.instructions.md](instructions/react/code-review.instructions.md)
  - General Review: [.github/instructions/workflow/code-review.instructions.md](instructions/workflow/code-review.instructions.md)
  - React Naming: [.github/instructions/react/naming-conventions.instructions.md](instructions/react/naming-conventions.instructions.md)
  - File Structure: [.github/instructions/react/file-structure.instructions.md](instructions/react/file-structure.instructions.md)
  - JSDoc Standards: [.github/instructions/react/jsdoc-standards.instructions.md](instructions/react/jsdoc-standards.instructions.md)
  - Interaction Facade: [.github/instructions/methodology/ai-assistant-interaction.instructions.md](instructions/methodology/ai-assistant-interaction.instructions.md)
  - Large File Protocol: [.github/instructions/methodology/large-file-editing.instructions.md](instructions/methodology/large-file-editing.instructions.md)
- Step 2: Apply all rules from those docs during implementation/review
- Step 3: Output the mandatory summary at the end of every PR review (see below)

## React Development References
- Practices: [.github/instructions/react/react.instructions.md](instructions/react/react.instructions.md)
- TypeScript: [.github/instructions/language/typescript.instructions.md](instructions/language/typescript.instructions.md)
- HTML: [.github/instructions/language/html.instructions.md](instructions/language/html.instructions.md)
- SCSS: [.github/instructions/language/scss.instructions.md](instructions/language/scss.instructions.md)
- i18n: [.github/instructions/react/i18n.instructions.md](instructions/react/i18n.instructions.md)

## Commit Messages
- Follow: [.github/instructions/workflow/commit-message.instructions.md](instructions/workflow/commit-message.instructions.md)
- Include Jira ID in the format: `<type>:<JIRA-ID> <description>`

## Mandatory PR Review Summary
Paste the following at the end of every review comment:

```markdown
## Code Review Summary

### 1. Required Changes
- [ ] (List all required changes, each with a concise description and location)

### 2. Suggested Improvements
- [ ] (List all suggested improvements, each with a concise description and location)

---
Powered By AI Instructions
```

## Enforcement Notes
- Do not restate rules here—refer to the linked documents.
- The linked standards govern: state management, data fetching (SWR + services), file organization, naming, styling (Tailwind + `cn()`), documentation (JSDoc), security, and performance.
- If a conflict arises, follow the precedence defined in the Interaction Facade.

