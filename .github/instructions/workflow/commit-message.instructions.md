---
applyTo: "**"
excludeAgent: ["code-review"]
---

# Git Commit Message Generator

## Introduction

This guide provides comprehensive instructions for generating consistent, informative commit messages that enhance our project's history and traceability. Well-crafted commit messages serve several important purposes:

- Facilitate code reviews by clearly explaining changes
- Create a meaningful project history for future reference
- Support automated changelog generation
- Aid in issue tracking and project management

Following these guidelines is mandatory for all contributors to maintain consistency across our codebase.

## Type Reference

| Type     | Description                                   | When to Use                                                           |
| -------- | --------------------------------------------- | --------------------------------------------------------------------- |
| build    | Changes to build system/external dependencies | When modifying build configuration, dependencies, or package settings |
| chore    | Maintenance tasks                             | For routine tasks that don't modify src or test files                 |
| ci       | CI configuration changes                      | When modifying CI pipelines, scripts, or configs                      |
| docs     | Documentation only changes                    | When only updating documentation with no code changes                 |
| feat     | New features                                  | When adding new functionality or features                             |
| fix      | Bug fixes                                     | When fixing bugs or resolving issues                                  |
| perf     | Performance improvements                      | When improving performance without changing functionality             |
| refactor | Code restructuring                            | When reorganizing code without changing its behavior                  |
| revert   | Reverting previous changes                    | When undoing a previous commit                                        |
| style    | Formatting, whitespace, etc.                  | When changing formatting with no functional code change               |
| test     | Adding or fixing tests                        | When adding or modifying test cases                                   |
| i18n     | Internationalization changes                  | When adding or updating translations or locale settings               |

## Rules

1. All commit messages must be written in English.
2. ALWAYS begin with type prefix: `fix:`, `feat:`, etc.
3. Use imperative mood for description (e.g., "add" not "added")
4. No capitalization after colon, no period at end
6. Optional: Add detailed description in body if needed

## Message Format

`<type>: <description>`

Optional extended format:
```
<type>: <description>

<body>
```

## Code Analysis Guidelines

When analyzing code changes to determine the appropriate commit type and message:

1. **Comprehensive Code Analysis**:

   - Examine added, modified, and deleted files
   - Identify key modification points (API changes, bug fixes, feature additions)
   - Determine the scope of changes (affected components/modules)
   - Assess the purpose of changes (fixing issues, adding features, improving performance)

2. **Change Classification**:

   - Categorize the change according to its primary purpose
   - Determine the most appropriate commit type for the change
   - Consider the broader impact of the change on the codebase

3. **Code Change Detection**:
   - Identify patterns in code modifications that indicate specific change types
   - Recognize refactoring patterns versus feature additions
   - Distinguish between bug fixes and enhancements

## Message Writing Guidelines

Create effective commit messages that provide value to the development team:

1. **Message Crafting**:

   - Focus on the "what" and "why" of the change, not the "how"
   - Balance brevity with sufficient detail for clarity
   - Ensure the message provides value to developers reviewing the commit history

2. **Effective Description Principles**:
   - Be specific about what changed and why it was necessary
   - Mention the impact or benefit of the change when relevant
   - Reference related issues or components affected

## Workflow Considerations

Consider the development context when creating commit messages:

1. **Workflow Process**:
   - Analyze branch information to provide context for the commit
   - Consider the development workflow stage (feature development, bug fixing, release)
   - Ensure the commit message serves project tracking and history purposes

## Output Format

`<type>: <description>`

## Examples

✅ `refactor: optimize server port configuration`
✅ `chore: update lint-staged script`
✅ `fix: resolve null pointer exception in user service`
✅ `feat: add Spring Boot template sync support`
❌ `Fix authentication issue` (missing type prefix)
❌ `feat:Add new feature` (no space after colon)
❌ `feat: Added new feature.` (not imperative mood, has period)
