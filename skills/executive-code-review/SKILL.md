---
name: executive-code-review
description: Performs CTO-like findings-first review of diffs, PRs, patches, or uncommitted changes. Use when reviewing code for user regressions, security/privacy issues, architecture debt, operational risk, cost impact, product ambiguity, migration safety, missing tests, or release readiness. Prefer architecture-review, product-surface-review, or security-privacy-review when the user wants one deep single-lens review rather than a full diff review.
---

# Executive Code Review

## Workflow

1. Identify the review target: diff, PR, branch, commit range, files, or pasted patch. In a git repository with no explicit target, review uncommitted work including staged, unstaged, and new files; for a branch, diff against the merge-base with the default branch. Read the stated intent before judging the change.
2. Inspect the surrounding code, tests, docs, permissions, data flow, and user-facing behavior needed to validate the change.
3. Prioritize actionable defects over style. A finding must identify a real bug, regression, broken invariant, security/privacy issue, operational risk, or missing verification that matters.
4. Review through five lenses: product surface, architecture and maintainability, security/privacy, operations and cost, and test/release safety.
5. Avoid assuming a specific host, CI, framework, issue tracker, or deployment path. Infer tooling from repo evidence.
6. Preserve user work. Do not suggest reverting unrelated changes unless the user explicitly asks.
7. If no actionable findings exist, say so clearly and name any residual risk or test gap.

## Output

Lead with findings, ordered by severity:

- `[P0]` release blocker, active exploit, data loss, widespread outage, or irreversible destructive behavior.
- `[P1]` likely user-facing regression, authorization/privacy break, migration hazard, or serious operational risk.
- `[P2]` moderate bug, missing guardrail, important test gap, or maintainability issue with plausible near-term cost.
- `[P3]` low-risk issue that still affects correctness, clarity, or future review.

This scale mirrors the optional repo-level review rubric; keep both copies aligned during repo maintenance.

Each finding should include the affected file and line when available, the impact, and the smallest credible fix direction. Example finding:

```text
[P1] api/routes.py:88 - /admin/export moved to the shared router with no server-side
role check; any signed-in user can export customer data. Fix: enforce the admin
permission in the handler and add a test that a non-admin request gets 403.
```

Then include:

- Open questions or assumptions.
- Change summary, only after findings.
- Verification reviewed or missing.

## Checklist

- Product: workflow, states, user trust, accessibility, business fit, and support burden.
- Architecture: boundaries, contracts, data flow, dependency weight, complexity, and maintenance.
- Security/privacy: auth, permissions, sensitive data, logging, integrations, and abuse cases.
- Operations/cost: deploy, rollback, observability, retries, queues, external services, and spend.
- Verification: tests, manual checks, migration checks, release gates, and monitoring.
