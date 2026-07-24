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
- Likelihood: High, Medium, or Low.
- Disposition: Blocking, Non-blocking, or Follow-up.
- Type: current defect/regression, missing validation, or optional improvement.
- Boundary: where the trust or data boundary is crossed.
- Impact: who can do what, or what data is exposed.
- Evidence: code, design, API, log, or workflow reference.
- Fix: smallest credible mitigation and verification.

Use severity for impact if the issue occurs, independent of release disposition:

- `[P0]` catastrophic impact such as active compromise, irrecoverable data loss, widespread outage, or irreversible destructive behavior.
- `[P1]` serious user or business harm, authorization/privacy break, migration corruption, or major operational failure.
- `[P2]` moderate bug, missing guardrail, important test gap, or maintainability issue with plausible near-term cost.
- `[P3]` low-risk issue that still affects correctness, clarity, or future review.

Use confidence labels:

- High: directly observed in code, diff, design, or behavior with an unambiguous trace to impact.
- Medium: supported by concrete evidence, but one assumption remains about runtime behavior, configuration, user path, or intended policy.
- Low: plausible risk with incomplete evidence; keep the impact severity conditional and state the assumption or open question that needs validation.

Label likelihood from path exposure and required preconditions; do not use confidence as a proxy for occurrence probability. Assign `Blocking` when the issue must be fixed or explicitly risk-accepted before merge or release, `Non-blocking` when it is actionable but safe to merge, and `Follow-up` when it belongs in a separate ticket. Low likelihood does not make authorization bypass, privacy exposure, cross-tenant access, data loss, incorrect billing, or another high-consequence and hard-to-recover failure non-blocking. Limited, containable, and recoverable low-likelihood hardening is usually non-blocking or follow-up work.

Keep severity tied to conditional impact rather than evidence certainty. Blocking dispositions require concrete evidence of a reachable risk or a missing required high-risk release gate: cite a file:line or surface reference plus a short quote or paraphrase of the offending line, state, behavior, or validation gap when available. If reachability cannot be supported, keep the severity conditional, lower confidence, and move the item to assumptions or open questions rather than blocking. Recommend a follow-up ticket only for independently actionable work, stating why it can wait and how completion will be verified.

Then include the overall verdict (`Block`, `Approve with follow-ups`, or `Approve`), residual risk, assumptions, and tests or controls reviewed. Explicitly say `No blocking findings` when appropriate.

Example finding:

```text
[P1][High confidence][Medium likelihood][Blocking] billing/webhooks.py:41 -
Webhook updates billing state before signature verification. Type: current
regression. Evidence: `mark_paid(payload.invoice_id)` runs before any signature
check. Impact: a forged public request can mark invoices paid. Fix: verify the
provider signature, reject stale timestamps, and test unsigned payloads.
```

## Checklist

- Authentication and authorization are enforced at the backend boundary.
- Untrusted input, webhooks, third-party APIs, generated content, and admin surfaces are validated.
- Sensitive data collection, logging, retention, export, deletion, and exposure are minimized.
- Abuse cases include enumeration, replay, injection, privilege escalation, rate limits, and billing abuse when relevant.
- Tests or controls prove the critical trust boundary.
- Findings keep impact, evidence confidence, occurrence likelihood, and merge/release disposition separate.
- Low-likelihood high-consequence security and privacy failures remain blocking.
