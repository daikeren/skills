# Review Rubric

Use this rubric for code, product, architecture, security, and release reviews.

## Severity

- P0: release blocker, active exploit, data loss, widespread outage, or irreversible destructive behavior.
- P1: likely user-facing regression, authorization/privacy break, migration hazard, or serious operational risk.
- P2: moderate bug, missing guardrail, important test gap, maintainability issue with plausible near-term cost.
- P3: low-risk issue that still affects correctness, clarity, or future review.

## Review Lenses

- Product: workflow, states, user trust, accessibility, business fit, support burden.
- Architecture: boundaries, contracts, data flow, dependency weight, complexity, maintenance.
- Security/privacy: auth, permissions, sensitive data, logging, integrations, abuse cases.
- Operations/cost: deploy, rollback, observability, retries, queues, external services, spend.
- Verification: tests, manual checks, migration checks, release gates, monitoring.

## Finding Standard

An actionable finding must include:

- Location or affected surface.
- Impact on users, operators, security, data, cost, or delivery.
- Evidence from diff, code path, design, or behavior.
- A credible fix direction.

Avoid findings based only on preference, broad speculation, or unrelated cleanup.
