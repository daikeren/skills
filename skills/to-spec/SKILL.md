---
name: to-spec
description: Converts an already chosen direction, settled conversation, prototype learning, or option choice into a lightweight implementation spec with bounded pressure-testing, testing seams, and durable decision capture when warranted. Use when the direction is decided and the user needs goals, non-goals, constraints, UX or API contract, rollout, validation, and open questions without heavyweight PRD sludge. Use scope-work first when the problem frame or chosen direction is not stable enough to bound a spec.
---

# To Spec

## Workflow

1. Confirm the readiness gate: a direction has been explicitly chosen or clearly settled, and the problem frame is stable enough to bound the spec. If core goals, affected users, or constraints are so unclear that they could change the direction or scope, route to `scope-work` or `strategy-to-options` instead of filling the gaps with assumptions. Keep non-direction-changing implementation unknowns as explicit open questions.
2. Synthesize from the conversation, referenced artifacts, and relevant repo context. Do not re-interview when the answer is already available.
3. Check repo-local context, lessons, glossary, ADRs, or similar stores before settling terms, contracts, rollout, or validation.
4. Explore the repo only enough to understand current behavior, stable interfaces, domain vocabulary, ADRs, and similar prior art.
5. Scale depth to risk. Low-risk, solo, reversible work can use a short spec; cross-functional, irreversible, sensitive-data, migration, security, or compliance work needs deeper constraints, rollout, and validation detail.
6. Run a bounded grilling pass before freezing the spec: challenge overloaded terms, test edge-case scenarios, cross-check the story against code or docs when available, and surface assumptions that could change scope, design, rollout, or risk.
7. Clarify only blocking unknowns within the chosen direction. If a missing user-owned decision could change the direction, stop rather than producing a final spec.
8. Human owns decisions; agent owns facts, contracts, edge cases, and assumptions.
9. Sketch validation seams before implementation details. Prefer the highest existing seam that proves external behavior; add new seams only when needed and keep them few.
10. Write the spec around externally visible behavior and system contracts, not a file-by-file plan.
11. Include product, architecture, security/privacy, operational, cost, and rollout considerations only where they affect the implementation.
12. Keep the spec lightweight enough that an agent can execute it in small slices.
13. Mark decisions as accepted, proposed, or open before handoff. Do not paste a full implementation spec into an issue tracker. When the requested destination is an issue or ticket, use `to-tickets` to transform the spec into an outcome contract that references the authoritative spec when it has a durable location and carries concise accepted constraints an implementer must not reopen. If the spec is not durably addressable, include that compact decision handoff in the ticket rather than depending on hidden conversation context; keep rationale and internal mechanics out of the issue body.
14. For cross-session handoff, prefer the repo's existing spec convention. If none exists, propose a path and minimal frontmatter instead of forcing file creation.
15. If a domain term or decision crystallizes, include it in the spec and suggest optional glossary or ADR capture only when the decision is hard to reverse, surprising without context, and the result of a real tradeoff.
16. If a prototype produced useful decision artifacts, include only the decision-rich snippet or learned constraint, not throw-away demo code.

## Output

Use this structure:

- Decision basis: the chosen direction and the conversation, option, or prototype evidence that settled it.
- Problem: user or business problem.
- Goals: outcomes the work must achieve.
- Non-goals: what this intentionally will not solve.
- Constraints: compatibility, policy, data, timing, budget, and team constraints.
- Pressure test: fuzzy terms, edge cases, code/story contradictions, and assumptions that could change scope or risk.
- UX/API contract: user flow, states, permissions, inputs, outputs, errors, and data contract.
- Technical approach: key design decisions and whether each is accepted or proposed, domain terms, ADRs, and integration points.
- Rollout and operations: flags, migration, monitoring, support, cost, and rollback.
- Validation: highest useful testing seams, similar prior tests, manual checks, metrics, and evidence needed before release.
- Open questions: implementation or design unknowns that do not reopen the chosen direction or bounded scope; direction-changing questions return the work to the readiness gate.
- Decision handoff: concise accepted constraints downstream tickets must preserve, plus the durable spec or ADR reference when one exists.
- Handoff artifact: existing repo location, or proposed path and frontmatter when a durable spec should cross sessions.

Avoid stale implementation detail. Mention files only when they are stable interfaces or required context.

Example contract line:

```text
Export button: visible to workspace admins only; disabled with a tooltip while an
export is running; failure shows a retryable error and never leaves partial files.
```
