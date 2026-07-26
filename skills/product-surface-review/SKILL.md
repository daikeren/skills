---
name: product-surface-review
description: Reviews user-facing workflows, empty, loading, error, and recovery states, accessibility, trust, support burden, and business goal alignment. Use when evaluating a product surface, feature flow, onboarding, settings, billing/admin screen, documentation touchpoint, or any user experience before build, release, or redesign. For a full code diff review, use review-code instead.
---

# Product Surface Review

## Workflow

1. Identify the target user, job-to-be-done, business goal, and release context.
2. Stay report-only. Inspect and report findings or recommendations; do not edit designs, copy, code, docs, or configuration unless the user explicitly changes the task from review to fix.
3. Establish the evidence boundary before calling something a defect. Review supplied behavior, designs, code, or runtime evidence; do not treat an unspecified state or control as proof that the product lacks it. Put consequential unknowns under assumptions, open questions, or missing validation unless a required release gate is itself absent. When the task already supplies a bounded surface snapshot, use it directly instead of searching the repository for context that cannot change the finding.
4. Walk the surface as a user: entry point, happy path, edge states, empty/loading/error states, permissions, destructive actions, and recovery. If no running instance is available, walk the routes, templates, components, and copy that render the surface.
5. Check clarity, trust, accessibility, privacy disclosure, support burden, and measurement only where they can change the user outcome or release decision. Do not emit the checklist as generic findings.
6. Separate user regressions from taste, optional future improvements, and missing validation. Make only actionable findings tied to impact.
7. Review implementation only as needed to validate behavior, state coverage, and accessibility risk.
8. Recommend the smallest product change that improves user outcome without widening scope unnecessarily.

## Output

Lead with findings:

- Severity: user impact if the issue occurs.
- Confidence: High, Medium, or Low.
- Likelihood: High, Medium, or Low.
- Disposition: Blocking, Non-blocking, or Follow-up.
- Type: current defect/regression, missing validation, or optional improvement.
- Surface: where the issue appears.
- Evidence: observed flow, text, state, or code.
- Impact: user, support, accessibility, trust, privacy, or business consequence.
- Fix: smallest credible direction.

Use severity for impact if the issue occurs, independent of release disposition:

- `[P0]` catastrophic impact such as active compromise, irrecoverable data loss, widespread outage, or irreversible destructive behavior.
- `[P1]` serious user or business harm, authorization/privacy break, migration corruption, or major operational failure.
- `[P2]` moderate bug, missing guardrail, important test gap, or maintainability issue with plausible near-term cost.
- `[P3]` low-risk issue that still affects correctness, clarity, or future review.

Use confidence labels:

- High: directly observed in code, diff, design, or behavior with an unambiguous trace to impact.
- Medium: supported by concrete evidence, but one assumption remains about runtime behavior, configuration, user path, or intended policy.
- Low: plausible risk with incomplete evidence; keep the impact severity conditional and state the assumption or open question that needs validation.

Label likelihood from how exposed and reachable the user path is, separately from evidence confidence. Assign `Blocking`, `Non-blocking`, or `Follow-up` to say whether the issue must be fixed before merge or release, can ship as-is, or belongs in a separate ticket. Low-likelihood issues remain blocking when they can cause catastrophic, irreversible, cross-tenant, permission, privacy, data-loss, destructive, or incorrect financial outcomes. Limited, recoverable degraded-UX cases with uncommon preconditions are usually non-blocking or follow-up work.

Keep severity tied to conditional impact rather than evidence certainty. Blocking dispositions require concrete evidence of a reachable risk or a missing required high-risk release gate: cite a file:line or surface reference plus a short quote or paraphrase of the offending line, state, behavior, or validation gap when available. If reachability cannot be supported, keep the severity conditional, lower confidence, and move the item to assumptions or open questions rather than blocking. Recommend a follow-up ticket only when it is independently actionable; state why it can wait and how completion will be verified.

Scale the report to the evidence. A narrow surface with one bounded issue may need only a verdict, one compact finding, and its verification signal. Omit generic accessibility, measurement, support, and process commentary when it neither exposes a concrete risk nor changes the disposition.

Always include the overall verdict. Include the remaining sections only when they carry decision-relevant information:

- Overall verdict: `Block`, `Approve with follow-ups`, or `Approve`; explicitly say `No blocking findings` when appropriate.
- Workflow summary when the path is broader than the findings already show.
- Missing states or instrumentation that change confidence or disposition.
- Release confidence and validation still needed.

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
- Permission, billing, destructive, and privacy-sensitive actions preserve user trust.
- Accessibility covers keyboard, focus, contrast, screen reader, motion, and touch concerns when relevant.
- Findings tie to user impact or support burden, not taste alone.
- Release confidence names missing validation or instrumentation.
- Findings keep impact, evidence confidence, occurrence likelihood, and merge/release disposition separate.
- Low-likelihood catastrophic or irreversible outcomes remain blocking.
