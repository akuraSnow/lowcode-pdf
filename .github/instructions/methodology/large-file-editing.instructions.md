---
applyTo: "**/*.ts,**/*.tsx"
---

# Large File and Complex Change Protocol

> This document defines a structured approach for handling large files and complex changes.

## 1. Mandatory Planning Phase (MUST)

When working with large files (>300 lines) or complex changes:

1. A detailed plan **MUST** be created before any edits
2. The plan **MUST** include:

   - All functions/sections requiring modification
   - The sequence in which changes should be applied
   - Dependencies between changes
   - Estimated number of separate edits required

3. Present the plan using the Planning Template in #2.

## 2. Planning Template (MUST)

```
PLAN
Target Files: [list]
Change Type: Refactor|Feature|Fix|Hybrid
Scope Summary: [1–3 lines]
Risk Level: Low|Medium|High (see #7)
Rollback Points: [commits / logical checkpoints]
Test Focus: Unit|Integration|Behavior|Performance (choose ≥1)
Edge Cases: [enumerated list]
Estimated Edit Count: [integer]
Potential Cross-File Impacts: [list or 'None']
Success Criteria: [verifiable outcomes]
Assumptions: [key assumptions; each testable]
Dependencies: [libraries / external services / pending clarifications]
Timeboxing / Review Cadence (optional): [e.g., after edit #3 reassess]
```

The Facade may summarize or reformat this template when interacting with users; the semantic fields MUST remain.

## 3. Executing Edits (MUST)

- Focus on one conceptual change at a time
- Display clear "before" and "after" code snippets when proposing changes
- Include concise explanations of what changed and why
- Always verify that edits maintain the project's coding style

## 4. Edit Sequence

Use the approved plan to enumerate a linear, dependency-ordered list of conceptual edits. Each list item SHOULD include: Identifier / Purpose / Expected Diff Scope / Risk Note (if elevated). Confirmation & pacing are orchestrated by the Facade; do not restate confirmation boilerplate here.

## 5. Execution Phase

- After each individual edit, clearly indicate progress: "✅ Completed edit [#]/[total]. Ready for next edit?"
- If additional necessary changes are discovered during editing:
  - Stop and update the plan
  - Obtain approval before continuing

## 6. Refactoring Guidance

When refactoring large files:

- Break work into logically independent functional blocks
- Ensure each intermediate state maintains functionality
- Consider temporary duplication as a valid interim step
- Always indicate which refactoring pattern is being applied (e.g., Extract Function, Inline, Move Module, Introduce Adapter, Strangler Fig)

## 7. Risk Assessment (SHOULD)

Risk Level guidelines:

- Low: Localized, no public API changes, ≤2 edit points
- Medium: Multiple files, minor API shape adjustments, moderate coupling
- High: Public API / widely used modules, performance/security implications, wide ripple

Mitigation checklist (MAY select as appropriate):

- Define rollback branch/tag before first edit
- Add temporary guard / feature flag
- Add targeted characterization tests (performance, memory)
- Insert logging or metrics for behavior verification (avoid sensitive data)

## 8. Update & Replan Rules (MUST)

Trigger a REPLAN when:

- Unplanned edit points exceed 25% of Estimated Edit Count
- Newly discovered cross-file impacts not listed originally
- Risk Level escalates (e.g., Medium → High)
- Core assumption invalidated (Assumptions field)
- Success Criteria need expansion due to stakeholder change

Replan Procedure:

1. Freeze ongoing edit after completing current atomic change.
2. Produce delta summary: (Original vs New) for Scope / Risk / Edit Count / Impacts.
3. Await Facade/user approval before proceeding.
4. Archive old plan (append to document or log) for traceability.

## 9. Completion Checklist (SHOULD)

Before declaring completion:

- All planned edit items marked done
- No unresolved high-risk assumptions
- Tests for listed Edge Cases executed or outlined
- Rollback points not required (no critical regressions observed)
- Success Criteria objectively met
