---
name: product-surface-review
description: Reviews user-facing workflows, UI states, accessibility, trust, support burden, and business goal alignment. Use when evaluating a product surface, feature flow, onboarding, settings, billing/admin screen, error state, documentation touchpoint, or any user experience before build, release, or redesign. For a full code diff review, use executive-code-review instead.
---

# Product Surface Review

## Workflow

1. Identify the target user, job-to-be-done, business goal, and release context.
2. Walk the surface as a user: entry point, happy path, edge states, empty/loading/error states, permissions, destructive actions, and recovery. If no running instance is available, walk the routes, templates, components, and copy that render the surface.
3. Check clarity, trust, accessibility, privacy disclosure, support burden, and measurement.
4. Separate user regressions from taste. Make only actionable findings tied to impact.
5. Review implementation only as needed to validate behavior, state coverage, and accessibility risk.
6. Recommend the smallest product change that improves user outcome without widening scope unnecessarily.

## Output

Lead with findings:

- Severity: user impact and release risk.
- Surface: where the issue appears.
- Evidence: observed flow, text, state, or code.
- Recommendation: concrete improvement.

Then include:

- Workflow summary.
- Missing states or instrumentation.
- Release confidence and validation needed.

Example finding:

```text
[P1] Checkout - applying an invalid coupon clears the cart with no error message;
users lose their order and start over. Recommend: keep cart state, show an inline
coupon error, and add a state test for invalid codes.
```

## Checklist

- Entry point, happy path, edge states, loading, empty, and error states are reviewed.
- Permission, billing, destructive, and privacy-sensitive actions preserve user trust.
- Accessibility covers keyboard, focus, contrast, screen reader, motion, and touch concerns when relevant.
- Findings tie to user impact or support burden, not taste alone.
- Release confidence names missing validation or instrumentation.
