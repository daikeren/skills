---
name: to-spec
description: Converts an agreed direction, conversation, prototype learning, or option choice into a lightweight implementation spec. Use when the user needs problem framing, goals, non-goals, constraints, UX or API contract, rollout plan, validation, and open questions without heavyweight PRD sludge.
---

# To Spec

## Workflow

1. Read the conversation, referenced artifacts, and relevant repo context. Do not re-interview if the answer is already available.
2. Clarify only blocking unknowns. If safe assumptions unblock progress, write them explicitly.
3. Write the spec around externally visible behavior and system contracts, not a file-by-file plan.
4. Include product, architecture, security/privacy, operational, cost, and rollout considerations only where they affect the implementation.
5. Keep the spec lightweight enough that an agent can execute it in small slices.
6. If a prototype produced useful decision artifacts, include only the decision-rich snippet or learned constraint, not throw-away demo code.

## Output

Use this structure:

- Problem: user or business problem.
- Goals: outcomes the work must achieve.
- Non-goals: what this intentionally will not solve.
- Constraints: compatibility, policy, data, timing, budget, and team constraints.
- UX/API contract: user flow, states, permissions, inputs, outputs, errors, and data contract.
- Technical approach: key design decisions and integration points.
- Rollout and operations: flags, migration, monitoring, support, cost, and rollback.
- Validation: tests, manual checks, metrics, and evidence needed before release.
- Open questions: only unresolved questions that can change scope or design.

Avoid stale implementation detail. Mention files only when they are stable interfaces or required context.

Example contract line:

```text
Export button: visible to workspace admins only; disabled with a tooltip while an
export is running; failure shows a retryable error and never leaves partial files.
```
