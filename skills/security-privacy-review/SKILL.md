---
name: security-privacy-review
description: Reviews authentication, authorization, sensitive data, integrations, public APIs, billing/admin surfaces, trust boundaries, abuse cases, and data minimization. Use when code, designs, specs, or products touch permissions, personal data, secrets, third-party systems, webhooks, payments, admin actions, AI outputs, or external exposure. For a full multi-lens diff review, use review-code instead.
---

# Security Privacy Review

## Workflow

1. Define assets, actors, trust boundaries, sensitive data, and externally reachable paths.
2. Stay report-only. Inspect and report findings; do not edit code, policy, docs, configuration, or designs unless the user explicitly changes the task from review to fix.
3. Inspect backend checks and data flow, not only frontend visibility. Treat UI gates as convenience, not authorization.
4. Review authentication, authorization, input validation, secrets, logging, retention, export/delete paths, integrations, billing, admin actions, and abuse cases.
5. Apply data minimization: collect less, retain less, expose less, log less, and share less unless the product goal requires it.
6. Separate new regressions from existing policy decisions, optional future hardening, and missing validation. Be precise about impact and exploitability.
7. Recommend fixes that fit the codebase and release path, including tests, monitoring, and rollout gates.

## Output

Lead with findings:

- Severity: `[P0]`, `[P1]`, `[P2]`, or `[P3]`.
- Confidence: High, Medium, or Low.
- Type: current defect/regression, missing validation, or optional improvement.
- Boundary: where the trust or data boundary is crossed.
- Impact: who can do what, or what data is exposed.
- Evidence: code, design, API, log, or workflow reference.
- Fix: smallest credible mitigation and verification.

Use severity:

- `[P0]` release blocker, active exploit, data loss, widespread outage, or irreversible destructive behavior.
- `[P1]` likely user-facing regression, authorization/privacy break, migration hazard, or serious operational risk.
- `[P2]` moderate bug, missing guardrail, important test gap, or maintainability issue with plausible near-term cost.
- `[P3]` low-risk issue that still affects correctness, clarity, or future review.

Use confidence labels:

- High: directly observed in code, diff, design, or behavior with an unambiguous trace to impact.
- Medium: supported by concrete evidence, but one assumption remains about runtime behavior, configuration, user path, or intended policy.
- Low: plausible risk with incomplete evidence; frame as an assumption or open question and avoid P0/P1 severity.

P0/P1 findings require concrete evidence: file:line or surface reference plus a short quote or paraphrase of the offending line, state, or behavior when available. If evidence cannot be cited, lower the severity or mark it as an assumption or open question.

Then include residual risk, assumptions, and tests or controls reviewed.

Example finding:

```text
[P1][High] billing/webhooks.py:41 - Webhook updates billing state before signature verification.
Type: current regression. Evidence: `mark_paid(payload.invoice_id)` runs before
any signature check. Impact: a forged public request can mark invoices paid.
Fix: verify the provider signature, reject stale timestamps, and test unsigned payloads.
```

## Checklist

- Authentication and authorization are enforced at the backend boundary.
- Untrusted input, webhooks, third-party APIs, generated content, and admin surfaces are validated.
- Sensitive data collection, logging, retention, export, deletion, and exposure are minimized.
- Abuse cases include enumeration, replay, injection, privilege escalation, rate limits, and billing abuse when relevant.
- Tests or controls prove the critical trust boundary.
