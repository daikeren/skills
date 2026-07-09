---
name: cto-intake
description: Establishes a CTO-grade intake for ambiguous, consequential product or engineering work before implementation, including bounded pressure-testing of fuzzy terms, edge cases, and hidden tradeoffs. Use when a task has unclear goals, cross-functional impact, architecture risk, security or privacy exposure, cost or operational tradeoffs, stakeholder ambiguity, or a decision horizon that affects product direction. Use strategy-to-options instead when the problem is already framed and the user needs concrete options to choose between.
---

# CTO Intake

## Workflow

1. Start read-only. Inspect the request, nearby instructions, relevant docs, repo shape, and visible constraints before proposing work.
2. Identify the product goal, user impact, technical context, decision horizon, and success signal.
3. Surface constraints that change the answer: deadlines, compatibility, permissions, data sensitivity, compliance, budget, team capacity, rollout needs, and reversibility.
4. Name the main risks across product, architecture, security/privacy, operations, cost, and delivery speed.
5. Run a bounded grilling pass when the direction is fuzzy: challenge overloaded terms, invent concrete edge-case scenarios, cross-check stated behavior against code or docs when available, and expose hidden tradeoffs. Ask at most 3-5 questions that can change scope, design, rollout, or risk.
6. Capture durable learning only when it has crystallized. Suggest glossary terms or ADR-worthy decisions as optional follow-ups; do not create project docs unless the user asks or the repo already has that convention.
7. Ask only blocking questions. If a reasonable assumption is safe, state it and continue.
8. Convert the intake into the next useful action: implementation, research, options, spec, tickets, review, or prototype.

## Output

Return a compact intake snapshot:

- Problem: what decision or outcome is actually needed.
- Users and impact: who is affected and how success or failure shows up.
- Context: relevant system, workflow, data, and tool facts discovered so far.
- Constraints: requirements, non-goals, deadlines, policies, and compatibility limits.
- Risks: product, architecture, security/privacy, operations, cost, and team-speed concerns.
- Pressure test: fuzzy terms, edge cases, code/story contradictions, and tradeoffs that could change the path.
- Next move: the smallest useful next step and why it is reversible or appropriately decisive.

If the user clearly wants immediate execution and the risk is low, keep the snapshot brief and move into the work.

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
