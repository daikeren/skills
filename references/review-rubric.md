# Review Rubric

Use this rubric for code, product, architecture, security, and release reviews.

## Review Posture

- Reviews are report-only: inspect and report findings. Do not edit code, designs, docs, or configuration unless the user explicitly changes the task from review to fix.
- Separate current defects or regressions from optional future improvements and missing validation.
- Prefer a small set of evidence-backed findings over broad speculation.

## Severity

- P0: release blocker, active exploit, data loss, widespread outage, or irreversible destructive behavior.
- P1: likely user-facing regression, authorization/privacy break, migration hazard, or serious operational risk.
- P2: moderate bug, missing guardrail, important test gap, maintainability issue with plausible near-term cost.
- P3: low-risk issue that still affects correctness, clarity, or future review.

## Confidence

- High: directly observed in code, diff, design, or behavior with an unambiguous trace to impact.
- Medium: supported by concrete evidence, but one assumption remains about runtime behavior, configuration, user path, or intended policy.
- Low: plausible risk with incomplete evidence; frame as an assumption or open question and avoid P0/P1 severity.

## Review Lenses

- Product: workflow, states, user trust, accessibility, business fit, support burden.
- Architecture: boundaries, contracts, data flow, dependency weight, complexity, maintenance.
- Security/privacy: auth, permissions, sensitive data, logging, integrations, abuse cases.
- Operations/cost: deploy, rollback, observability, retries, queues, external services, spend.
- Verification: tests, manual checks, migration checks, release gates, monitoring.

## Finding Standard

An actionable finding must include:

- Severity and confidence.
- Type: current defect/regression, missing validation, or optional improvement.
- Location or affected surface.
- Impact on users, operators, security, data, cost, or delivery.
- Evidence from diff, code path, design, or behavior.
- A credible fix direction.

- P0/P1 findings require concrete evidence: file:line or surface reference plus a short quote or paraphrase of the offending line, state, or behavior when available. If evidence cannot be cited, lower the severity or mark it as an assumption or open question.
- Missing validation is a finding only when it hides likely risk in important behavior. Otherwise, list it as residual risk.
- Optional future improvements should not outrank current defects or regressions.

Avoid findings based only on preference, broad speculation, or unrelated cleanup.
