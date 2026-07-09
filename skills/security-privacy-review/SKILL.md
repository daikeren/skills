---
name: security-privacy-review
description: Reviews authentication, authorization, sensitive data, integrations, public APIs, billing/admin surfaces, trust boundaries, abuse cases, and data minimization. Use when code, designs, specs, or products touch permissions, personal data, secrets, third-party systems, webhooks, payments, admin actions, AI outputs, or external exposure. For a full multi-lens diff review, use executive-code-review instead.
---

# Security Privacy Review

## Workflow

1. Define assets, actors, trust boundaries, sensitive data, and externally reachable paths.
2. Inspect backend checks and data flow, not only frontend visibility. Treat UI gates as convenience, not authorization.
3. Review authentication, authorization, input validation, secrets, logging, retention, export/delete paths, integrations, billing, admin actions, and abuse cases.
4. Apply data minimization: collect less, retain less, expose less, log less, and share less unless the product goal requires it.
5. Separate new regressions from existing policy decisions. Be precise about impact and exploitability.
6. Recommend fixes that fit the codebase and release path, including tests, monitoring, and rollout gates.

## Output

Lead with findings:

- Severity: `[P0]` release blocker, active exploit, data loss, widespread outage, or irreversible destructive behavior; `[P1]` likely user-facing regression, authorization/privacy break, migration hazard, or serious operational risk; `[P2]` moderate bug, missing guardrail, important test gap, or maintainability issue with plausible near-term cost; `[P3]` low-risk issue that still affects correctness, clarity, or future review. This scale mirrors the optional repo-level review rubric; keep both copies aligned during repo maintenance.
- Boundary: where the trust or data boundary is crossed.
- Impact: who can do what, or what data is exposed.
- Evidence: code, design, API, log, or workflow reference.
- Fix: smallest credible mitigation and verification.

Then include residual risk, assumptions, and tests or controls reviewed.

Example finding:

```text
[P1] billing/webhooks.py:41 - provider webhook processed without signature
verification; a forged request can mark invoices paid. Boundary: public internet
to billing state. Fix: verify the provider signature, reject stale timestamps,
and add a test that an unsigned payload is rejected.
```

## Checklist

- Authentication and authorization are enforced at the backend boundary.
- Untrusted input, webhooks, third-party APIs, generated content, and admin surfaces are validated.
- Sensitive data collection, logging, retention, export, deletion, and exposure are minimized.
- Abuse cases include enumeration, replay, injection, privilege escalation, rate limits, and billing abuse when relevant.
- Tests or controls prove the critical trust boundary.
