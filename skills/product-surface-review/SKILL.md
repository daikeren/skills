---
name: product-surface-review
description: Reviews user-facing workflows, empty, loading, error, and recovery states, accessibility, trust, support burden, and business goal alignment. Use when evaluating a product surface, feature flow, onboarding, settings, billing/admin screen, documentation touchpoint, or any user experience before build, release, or redesign. For a full code diff review, use review-code instead.
---

# Product Surface Review

## Workflow

1. Establish the user, job, business goal, release decision, and evidence boundary. Stay report-only. A complete supplied surface is enough; do not search the repository for context that cannot change the verdict.
2. Trace the supplied workflow once from entry through the normal outcome, then challenge only the reachable alternate, loading, empty, error, permission, accessibility, and recovery states. Do not mistake an unspecified control or state for a confirmed defect.
3. For billing, admin, destructive, or otherwise consequential mutations, concentrate on the trust boundary: who can invoke the action, informed intent, separation of dangerous controls, duplicate or replay protection, ambiguous-outcome reconciliation, authoritative success rather than client-controlled claims, and recovery that preserves context.
4. Consider clarity, accessibility, privacy, support burden, and measurement when they change user harm or release confidence. Prefer a concrete finding or acceptance check over a generic coverage summary.
5. Separate current defects, missing validation, assumptions, and taste. Prioritize the few issues that change the user outcome or release decision, then recommend the smallest credible fix and verification signal.

## Output

Lead with `Block`, `Approve with follow-ups`, or `Approve`, then findings in decision order. For each finding, compactly state:

```text
[P0-P3][confidence][likelihood][Blocking|Non-blocking|Follow-up] surface
Evidence and reachable path. User or business impact. Smallest fix and verification.
```

Severity describes impact if the issue occurs; confidence describes evidence quality; likelihood describes exposure; disposition describes the release decision. Keep them separate. Low likelihood does not make authorization, privacy, data-loss, irreversible, destructive, or incorrect financial harm non-blocking. Blocking requires concrete reachability or a missing required high-risk gate.

Scale the report to the evidence. Omit generic workflow, accessibility, measurement, support, and process sections when they do not expose a risk or change the verdict.

Example finding:

```text
[P1][High confidence][Medium likelihood][Blocking] Checkout coupon field -
invalid coupon clears the cart. Type: current regression. Evidence: after
"Apply" returns "Invalid coupon", the cart summary changes to empty. Impact:
users lose their order and start over. Fix: keep cart state, show inline coupon
error, and add an invalid-code state test.
```

## Checklist

- Entry point, happy path, edge states, loading, empty, and error states are reviewed.
- Consequential actions preserve permission, intent, authoritative outcome, idempotency, and recovery.
- Accessibility, privacy, support, and measurement appear only when decision-relevant.
- Findings keep impact, evidence confidence, occurrence likelihood, and merge/release disposition separate.
