# CTO Decision Rubric

Use this rubric when a decision affects product direction, architecture, risk, cost, operations, or team speed.

## Decision Frame

- Outcome: what user, business, or operational result matters.
- Horizon: whether the decision optimizes for today, this release, this quarter, or a long-lived platform bet.
- Reversibility: one-way door, two-way door, or cheap experiment.
- Evidence: facts, signals, testimonials, adoption data, risks, and unknowns.
- Stakeholders: users, operators, support, security, finance, legal, and the delivery team.

## Option Dimensions

- Product value: user impact, workflow fit, trust, activation, retention, revenue, or support reduction.
- Architecture fit: boundaries, data model, dependencies, extensibility, and maintenance cost.
- Security/privacy: sensitive data, trust boundaries, abuse cases, compliance, and blast radius.
- Operational burden: deploy, monitor, debug, recover, scale, and support.
- Cost: engineering time, infra, vendor fees, token spend, migration effort, and ongoing maintenance.
- Team speed: reviewability, independent release, cognitive load, onboarding, and coordination.
- Time to learn: how quickly the team can validate or invalidate the path.

## Recommendation Rules

- Prefer reversible, fast-learning paths when evidence is weak.
- Prefer boring, proven paths at security, billing, data-loss, and compliance boundaries.
- Prefer product clarity over architectural cleverness when user demand is unproven.
- Prefer architecture investment when repeated delivery is already slowing down.
- Prefer no-build when the problem is not strategic, usage is uncertain, or a vendor covers the risk better.

## Red Flags

- The option hides a policy decision inside implementation detail.
- The plan depends on a single unvalidated assumption.
- Rollback is unclear for a migration, billing, permissions, or data-retention change.
- The fastest path creates support work that exceeds engineering savings.
- The team cannot explain how success will be observed after release.
