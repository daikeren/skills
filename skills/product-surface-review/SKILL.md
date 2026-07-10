---
name: product-surface-review
description: Reviews user-facing workflows, empty, loading, error, and recovery states, accessibility, trust, support burden, and business goal alignment. Use when evaluating a product surface, feature flow, onboarding, settings, billing/admin screen, documentation touchpoint, or any user experience before build, release, or redesign. For a full code diff review, use review-code instead.
---

# Product Surface Review

## Workflow

1. Identify the target user, job-to-be-done, business goal, and release context.
2. Stay report-only. Inspect and report findings or recommendations; do not edit designs, copy, code, docs, or configuration unless the user explicitly changes the task from review to fix.
3. Walk the surface as a user: entry point, happy path, edge states, empty/loading/error states, permissions, destructive actions, and recovery. If no running instance is available, walk the routes, templates, components, and copy that render the surface.
4. Check clarity, trust, accessibility, privacy disclosure, support burden, and measurement.
5. Separate user regressions from taste, optional future improvements, and missing validation. Make only actionable findings tied to impact.
6. Review implementation only as needed to validate behavior, state coverage, and accessibility risk.
7. Recommend the smallest product change that improves user outcome without widening scope unnecessarily.

## Output

Lead with findings:

- Severity: user impact and release risk.
- Confidence: High, Medium, or Low.
- Type: current defect/regression, missing validation, or optional improvement.
- Surface: where the issue appears.
- Evidence: observed flow, text, state, or code.
- Impact: user, support, accessibility, trust, privacy, or business consequence.
- Fix: smallest credible direction.

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

Then include:

- Workflow summary.
- Missing states or instrumentation.
- Release confidence and validation needed.

Example finding:

```text
[P1][High] Checkout coupon field - invalid coupon clears the cart.
Type: current regression. Evidence: after "Apply" returns "Invalid coupon",
the cart summary changes to empty. Impact: users lose their order and start over.
Fix: keep cart state, show inline coupon error, and add an invalid-code state test.
```

## Checklist

- Entry point, happy path, edge states, loading, empty, and error states are reviewed.
- Permission, billing, destructive, and privacy-sensitive actions preserve user trust.
- Accessibility covers keyboard, focus, contrast, screen reader, motion, and touch concerns when relevant.
- Findings tie to user impact or support burden, not taste alone.
- Release confidence names missing validation or instrumentation.
