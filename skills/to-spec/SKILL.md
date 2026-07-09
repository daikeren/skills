---
name: to-spec
description: Converts an agreed direction, conversation, prototype learning, or option choice into a lightweight implementation spec with bounded pressure-testing, testing seams, and durable decision capture when warranted. Use when the user needs problem framing, goals, non-goals, constraints, UX or API contract, rollout plan, validation, and open questions without heavyweight PRD sludge.
---

# To Spec

## Workflow

1. Synthesize from the conversation, referenced artifacts, and relevant repo context. Do not re-interview when the answer is already available.
2. Explore the repo only enough to understand current behavior, stable interfaces, domain vocabulary, ADRs, and similar prior art.
3. Run a bounded grilling pass before freezing the spec: challenge overloaded terms, test edge-case scenarios, cross-check the story against code or docs when available, and surface assumptions that could change scope, design, rollout, or risk.
4. Clarify only blocking unknowns. If safe assumptions unblock progress, write them explicitly.
5. Sketch validation seams before implementation details. Prefer the highest existing seam that proves external behavior; add new seams only when needed and keep them few.
6. Write the spec around externally visible behavior and system contracts, not a file-by-file plan.
7. Include product, architecture, security/privacy, operational, cost, and rollout considerations only where they affect the implementation.
8. Keep the spec lightweight enough that an agent can execute it in small slices.
9. If a domain term or decision crystallizes, include it in the spec and suggest optional glossary or ADR capture only when the decision is hard to reverse, surprising without context, and the result of a real tradeoff.
10. If a prototype produced useful decision artifacts, include only the decision-rich snippet or learned constraint, not throw-away demo code.

## Output

Use this structure:

- Problem: user or business problem.
- Goals: outcomes the work must achieve.
- Non-goals: what this intentionally will not solve.
- Constraints: compatibility, policy, data, timing, budget, and team constraints.
- Pressure test: fuzzy terms, edge cases, code/story contradictions, and assumptions that could change scope or risk.
- UX/API contract: user flow, states, permissions, inputs, outputs, errors, and data contract.
- Technical approach: key design decisions, domain terms, ADRs, and integration points.
- Rollout and operations: flags, migration, monitoring, support, cost, and rollback.
- Validation: highest useful testing seams, similar prior tests, manual checks, metrics, and evidence needed before release.
- Open questions: only unresolved questions that can change scope or design.

Avoid stale implementation detail. Mention files only when they are stable interfaces or required context.

Example contract line:

```text
Export button: visible to workspace admins only; disabled with a tooltip while an
export is running; failure shows a retryable error and never leaves partial files.
```
