---
applyTo: "**/*.ts,**/*.tsx"
---

# Problem-Solving Methodology

## 1. Clarify the Problem and Confirm Objectives

- Always clarify the user's requirements and objectives before starting.
- Ask for missing context or information if anything is unclear.
- Break down complex problems into smaller, manageable tasks.

## 2. Structured Thinking and Planning

- Use top-down or bottom-up analysis to understand the problem structure.
- Create a step-by-step plan before implementation, outlining each sub-task and its dependencies.
- Define clear input, output, and acceptance criteria for each sub-task.

## 3. Solution Evaluation and Trade-offs

- Propose multiple feasible solutions when possible, and analyze their pros and cons.
- Prioritize solutions that are secure, maintainable, scalable, and performant.
- Always consider edge cases, error scenarios, and potential risks.

## 4. Execution and Feedback

- Implement solutions step by step, producing clear outputs at each stage.
- Document key decisions, assumptions, and intermediate results.
- Adjust the plan and communicate with stakeholders if new issues or requirements arise.

## 5. Review and Continuous Improvement

- After completing the task, review the process and summarize lessons learned.
- Extract reusable patterns, methods, or tools for future use.
- Continuously improve problem-solving processes and methodologies.

## 6. Communication and Collaboration

- Maintain clear and timely communication with users and team members.
- Proactively seek help or collaboration when needed.
- Record and confirm all important decisions and changes.

## 7. Transparency and Traceability

- Document all key steps, decisions, assumptions, and risk points.
- Ensure that solutions and implementations are consistent with the original objectives and easy to maintain or hand over.

## 8. Edge Case Categories (SHOULD)

Classify and proactively check the following edge case groups:

- Missing Context: Required input artifacts or files absent.
- Conflicting Requirements: Two or more user statements cannot simultaneously hold true.
- Hidden Dependencies: External modules, environment assumptions, or undocumented constraints.
- Performance Constraints: Latency, memory, throughput thresholds possibly impacted.
- Security / Compliance Sensitive: Data handling, privacy, access control implications.
- Ambiguity Cluster: Multiple interpretation paths with no dominant probability.

For each detected category, either (a) request a single clarifying input (MUST if ambiguity blocks correctness) or (b) proceed with explicitly stated, testable assumptions.

## 9. Output Planning Contract (MUST)

A valid actionable plan MUST enumerate at least:

1. Objectives: Clear, testable end goals.
2. Assumptions: Each stated so it can be validated or falsified.
3. Subtasks: Ordered list with dependency notes; keep atomic.
4. Acceptance Criteria: Observable pass/fail conditions per objective.
5. Validation Strategy: Tests, inspections, or probes to confirm outcomes.
6. Risks & Mitigations: Pair each notable risk with at least one mitigation or monitoring step.

Optional (MAY): Timeboxing / Prioritization tags, Complexity estimates.

## 10. Escalation to Large Change Protocol (SHOULD)

Trigger escalation (handover to [Large File & Complex Change Protocol](./large-file-editing.instructions.md)) when planning reveals ANY:

- ≥2 high-risk subtasks (public API, security, performance-critical)
- Cross-module ripple requiring synchronized edits
- Estimated conceptual edits > 5
- Need for rollback checkpoints or feature flags
- Plan spans multiple sessions / extended timeline

Escalation Handover Mapping:

| Planning Contract Field | Large Change Plan Field |
| ----------------------- | ----------------------- |
| Objectives              | Success Criteria        |
| Subtasks                | Estimated Edit Count    |
| Validation Strategy     | Test Focus / Edge Cases |
| Risks & Mitigations     | Risk Level + Mitigation |
| Dependencies            | Dependencies            |
