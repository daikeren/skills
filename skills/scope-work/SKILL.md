---
name: scope-work
description: Scopes ambiguous, high-impact, consequential product or engineering work before implementation, including bounded pressure-testing of fuzzy terms, edge cases, and hidden tradeoffs. Use when a task has unclear goals, cross-functional impact, architecture risk, security or privacy exposure, cost or operational tradeoffs, stakeholder ambiguity, or a decision horizon that affects product direction. Use strategy-to-options instead when the problem is already framed and the user needs concrete options to choose between.
---

# Scope Work

## Workflow

1. Start read-only. Inspect the request, nearby instructions, relevant docs, repo shape, and visible constraints before proposing work.
2. Check repo-local context, lessons, glossary, ADRs, or similar stores when prior decisions could change scope.
3. Identify the product goal, user impact, technical context, decision horizon, and success signal.
4. Surface constraints that change the answer: deadlines, compatibility, permissions, data sensitivity, compliance, budget, team capacity, rollout needs, and reversibility.
5. Scale depth to risk. Low-risk, solo, reversible work can use a lightweight snapshot; cross-functional, irreversible, sensitive-data, migration, security, or compliance work needs a standard or deeper pass.
6. Name the main risks across product, architecture, security/privacy, operations, cost, and delivery speed.
7. Run a bounded grilling pass when the direction is fuzzy: challenge overloaded terms, invent concrete edge-case scenarios, cross-check stated behavior against code or docs when available, and expose hidden tradeoffs.
8. Ask only blocking questions, one at a time when possible. If safe assumptions unblock low-risk work, state them and continue; if a user-owned decision is missing for high-risk work, stop and ask.
9. Human owns decisions; agent owns facts, constraints, risks, and assumptions. If the user is absent, proceed only on explicitly recorded low-risk assumptions.
10. Capture durable learning only when it has crystallized. Suggest glossary terms or ADR-worthy decisions as optional follow-ups; do not create project docs unless the user asks or the repo already has that convention.
11. Convert the scoped context into the next useful action: implementation, research, options, spec, tickets, review, or prototype.

## Output

Return a compact scope snapshot:

- Problem: what decision or outcome is actually needed.
- Users and impact: who is affected and how success or failure shows up.
- Context: relevant system, workflow, data, and tool facts discovered so far.
- Constraints: requirements, non-goals, deadlines, policies, and compatibility limits.
- Risks: product, architecture, security/privacy, operations, cost, and team-speed concerns.
- Pressure test: fuzzy terms, edge cases, code/story contradictions, and tradeoffs that could change the path.
- Decisions and assumptions: user-owned decisions still needed, plus any safe assumptions used to keep moving.
- Next move: the smallest useful next step and why it is reversible or appropriately decisive.

If the user clearly wants immediate execution, the risk is low, and no user-owned decision is missing, keep the snapshot brief and move into the work.

Example snapshot:

```text
Problem: decide whether to build usage metering in-house or adopt a vendor.
Users and impact: finance needs invoice-accurate usage; errors surface as disputes.
Constraints: quarter-end deadline; usage events contain customer identifiers.
Risks: metering accuracy (product), event volume (operations), PII retention (privacy).
Pressure test: clarify whether invoice accuracy means raw events or billable units;
stress-test late events, refunds, and customer data retention.
Next move: strategy-to-options with build, vendor, and defer paths.
```
