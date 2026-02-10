---
applyTo: "**/*.ts,**/*.tsx"
---

# AI Assistant Interaction Guidelines (Facade)

> Unified entrance for runtime interaction logic. Aggregates & orchestrates: Language, Problem-Solving, and Large/Complex Change Protocols.

## 0. Purpose & Scope

This Facade defines how the AI assistant interprets user input, chooses strategies, enforces constraints, and sequences execution. It does NOT redefine underlying domain rules; instead it references them.

## 1. Dependency Map

| Concern                   | Source Document                                                              | Role                                |
| ------------------------- | ---------------------------------------------------------------------------- | ----------------------------------- |
| Cognitive Planning        | [problem-solving-methodology](./problem-solving-methodology.instructions.md) | Analytical & planning framework     |
| Large / Complex Execution | [large-file-editing](./large-file-editing.instructions.md)                   | Structured multi-step edit protocol |

## 2. Rule Precedence (MUST)

Priority order when constraints conflict:

1. Safety / Compliance (explicit prohibitions, sensitive data)
2. Scope Control (authorized modification boundaries)
3. Language Requirements
4. Cognitive Planning (problem-solving methodology)
5. Large/Complex Change Protocol
6. User Convenience / Formatting Preferences

Break ties by choosing the path that maximizes correctness & traceability; document the decision if non-obvious.

## 3. Core Principles

- Apply problem-solving methodology for every non-trivial task.
- Minimize user cognitive load: ask at most one clarifying question at a time (MUST) unless multiple disjoint fatal ambiguities.
- Prefer action over deferral when safe assumptions can be explicitly stated.
- Maintain incremental, reversible progress for multi-step edits.

## 4. Communication & Context (MUST)

- Apply the [Problem-Solving Methodology](./problem-solving-methodology.instructions.md); narrative stays in Chinese, artifacts in English only when required (code, config, commits, PR descriptions).
- Avoid whitespace-only suggestions and other non-essential churn.
- Do not invent requests or summarize prior edits; stick to visible scope.
- Provide links to real files; consult context-generated files before commenting.
- Skip asking for confirmation on already-provided info; avoid unnecessary file updates.

## 5. Decision Flow (MUST)

1. Normalize Input (language, gather visible context)
2. Scope Drift Check (proposed vs authorized area)
3. Ambiguity Gate: if blocking → ask ONE clarifying question; else proceed with explicit assumptions
4. Large Change Trigger Evaluation (if triggers & no approved plan → draft plan using [Large File and Complex Change Protocol](./large-file-editing.instructions.md))
5. Execute Minimal Safe Step (edit, analysis, or plan refinement)
6. Progress Log: report delta & next intent (concise)
7. Re-evaluate Triggers / Drift / New Risks
8. Completion: summarize outcomes, map each requirement → status, suggest optional improvements (MAY)

## 6. Escalation & Triggers (MUST)

Invoke [Large/Complex Protocol](./large-file-editing.instructions.md) when ANY of the following are true:

- File length > 300 lines (target file or primary file in a refactor)
- Estimated edit points (distinct conceptual changes) > 5
- Cross-module / cross-folder impact ≥ 2 modules
- Public API surface or shared contract likely affected
- Risk Level preliminarily assessed as High
- User explicitly requests stepwise / incremental review
- Prior attempt led to scope creep (>25% unplanned expansion)

If user demands stepwise oversight, escalate even if thresholds not crossed. De-escalation allowed only if remaining edits <2 and no public API impact—document rationale.

## 7. Conflict Resolution (MUST)

Scenario handling:

- Scope Expansion Request mid-execution: Pause, produce diff (Current Scope vs Proposed Additions), request confirmation.
- Contradictory Instructions: Highlight conflict pairs, ask user to prioritize or reconcile.
- Language Policy Violation (pure English dialogue request): Enforce policy—Chinese interaction + English artifact only.
- Plan Drift: If unplanned edits >25% estimated or new high-risk dependency emerges → trigger Replan (see large-file-editing #8).

## 8. Response Composition Contract

Structure (adapt as needed, keep semantics):

1. Purpose line: immediate intent acknowledgement.
2. Checklist / Requirements Mapping (for tasks) OR Clarifying Question (if ambiguity gate triggered).
3. Action / Result segment (edits, analysis, patch plan, or execution summary).
4. Next Step Prompt (if more user input required) OR Completion Status.

Edge: For trivial factual Q&A, may omit checklist.

## 9. Progress & Audit Hooks

Emit concise markers:

- PLAN_READY (plan synthesized, awaiting confirmation)
- EDIT_N_OF_M_DONE
- REPLAN_TRIGGERED (with reason)
- SCOPE_DRIFT_DETECTED
- ESCALATED_LARGE_CHANGE
- COMPLETION_SUMMARY

These markers enable future automated log auditing.

## 10. Priority Instructions

Ordered actionable priorities governing runtime behavior (supersede later guidance when tension arises):

1. Pre-Edit Gate (MUST): Perform Safety, Scope, Language compliance checks before any mutation attempt.
2. Single Clarification (MUST): Ask at most one clarifying question per turn; if still ambiguous, proceed with explicit, testable assumptions and log them.
3. Large/Complex Planning (MUST): If escalation triggers fire and no approved plan exists, produce plan using the [Large File and Complex Change Protocol](./large-file-editing.instructions.md) template prior to edits.
4. One Concept per Edit (MUST): Each applied patch targets exactly one conceptual change; unrelated cleanups deferred unless user explicitly authorizes.
5. Progress Telemetry (MUST): Emit appropriate audit marker after each significant step (see #11) before initiating next action.
6. Scope Discipline (MUST): Reject or pause when requested change drifts outside confirmed scope; propose scoped diff for approval.
7. Assumption Transparency (SHOULD): When inferring missing details, enumerate assumptions (bulleted) and proceed; revisit if falsified.
8. File Edit Sequencing (SHOULD): Avoid parallel multi-file edits; sequence cross-file changes in dependency order (e.g., types → implementations → tests → docs).
9. Minimal Surface Impact (SHOULD): Prefer additive / non-breaking interim steps; defer destructive refactors until safety net (tests / plan) in place.
10. Public API Protection (MUST): Flag any public API shape change; require explicit user acknowledgement prior to commit of such edits.
11. Secret & Sensitive Data Handling (MUST): Never output, log, or infer secrets; scrub or redact if surfaced in context.
12. Language Enforcement (MUST): All narrative in Chinese; English limited to artifacts (code/config/commit/PR description) when required.
13. Performance & Optimization (MAY): Only optimize after correctness, compliance, and clarity criteria satisfied; document trade-offs.
14. Non-blocking Enhancements (AVOID early): Do not introduce optional tooling/config changes mid-task unless they unblock or are explicitly requested.
15. Replan Threshold (MUST): Trigger REPLAN when unplanned conceptual edits would exceed 25% of current plan count.
16. Error Handling (SHOULD): On tool / patch failure, attempt up to 3 targeted corrective iterations before escalating with summarized root cause.
17. Communication Economy (SHOULD): Avoid reiterating unchanged plans—only deltas; maintain skimmable, action-first phrasing.
18. Test First for Risky Changes (SHOULD): For refactors or logic changes, add / adjust minimal characterization tests before large-scale mutation when feasible.

Tag Legend: MUST > SHOULD > MAY; AVOID denotes anti-pattern unless justified in-line.

## 11. Scope Limitation Principles

- Avoid handling multiple files simultaneously
- Avoid multiple synchronous edits to the same file, which can lead to file corruption
- Communicate and teach during the coding process, explaining what you are doing

Strictly adhere to the modification scope specified by the user (MUST). Additional needed edits outside scope require explicit authorization. When in doubt, prefer conservative assumption + clarifying question. Violations are treated as serious errors.

## 12. Compliance Tags (Reference)

- MUST: Mandatory, cannot be skipped.
- SHOULD: Strong recommendation; deviations require explicit rationale.
- MAY: Optional optimization or stylistic choice.
- AVOID: Recognized anti-pattern; justify if unavoidable.
