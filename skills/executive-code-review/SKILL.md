---
name: executive-code-review
description: Performs CTO-like findings-first review of diffs, PRs, patches, or uncommitted changes, using parallel subagents when available to isolate spec/product, standards/architecture, security/privacy, operations, and verification lenses before aggregation. Use when reviewing code for user regressions, security/privacy issues, architecture debt, operational risk, cost impact, product ambiguity, migration safety, missing tests, or release readiness. Prefer architecture-review, product-surface-review, or security-privacy-review when the user wants one deep single-lens review rather than a full diff review.
---

# Executive Code Review

## Workflow

1. Identify the review target: diff, PR, branch, commit range, files, or pasted patch. In a git repository with no explicit target, review uncommitted work including staged, unstaged, and new files; for a branch or commit range, prefer a merge-base comparison when local evidence identifies the base. Confirm the target resolves and the diff is non-empty before deeper review.
2. Read the stated intent before judging the change. Look for a spec source in user text, issue or PR references, commit messages, branch names, nearby docs, `docs/`, `specs/`, or project planning files. If no spec exists, review without one and say so.
3. Find standards sources: repo instructions, contribution docs, coding standards, architecture docs, tests, CI, lint configs, generated-code conventions, and nearby code patterns. Repo standards override generic preferences.
4. Inspect the surrounding code, tests, docs, permissions, data flow, and user-facing behavior needed to validate the change.
5. For non-trivial reviews, launch parallel subagents when the harness provides them. Keep prompts self-contained: include the review target, diff command or pasted patch, relevant commit list, spec or intent source, standards sources, and the lens-specific brief. Do not pass your suspected findings unless asking a subagent to validate a specific concern.
6. Use at least these independent lenses:
   - Spec and product: missed requirements, scope creep, workflow regressions, edge states, trust, accessibility, and business impact.
   - Standards and architecture: documented standards, local idioms, boundaries, contracts, data flow, dependency weight, complexity, and maintainability.
   - Security and privacy: auth, permissions, sensitive data, logging, secrets, integrations, public APIs, billing/admin surfaces, and abuse cases.
   - Operations and verification: migrations, rollout, rollback, observability, queues, retries, external services, cost, tests, release gates, and monitoring.
7. If subagents are unavailable or the diff is tiny, run the same lenses as isolated local passes and note that fallback briefly after the findings.
8. Aggregate the reports. Verify each candidate finding against the code or diff, deduplicate overlaps, drop speculative issues that lack impact, and rerank by severity. Unlike single-axis review, the executive review should integrate the lenses into one findings-first risk order while preserving useful lens context.
9. Avoid assuming a specific host, CI, framework, issue tracker, or deployment path. Infer tooling from repo evidence.
10. Preserve user work. Do not suggest reverting unrelated changes unless the user explicitly asks.
11. If no actionable findings exist, say so clearly and name any residual risk or test gap.

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
- Coverage: target reviewed, spec or intent source, standards sources, and subagents or local passes used.
- Change summary, only after findings.
- Verification reviewed or missing.

## Subagent Briefs

Ask subagents for concise findings only. Each candidate finding should cite evidence, impact, and fix direction. Useful briefs:

- Spec and product reviewer: compare the diff with the requested behavior; report missing requirements, wrong behavior, scope creep, and user-facing regressions.
- Standards and architecture reviewer: compare the diff with repo standards and local patterns; report boundary, contract, data-flow, complexity, or maintainability risks.
- Security and privacy reviewer: inspect trust boundaries and sensitive data paths; report authorization, exposure, logging, secrets, integration, public API, billing, or abuse risks.
- Operations and verification reviewer: inspect release safety; report migration, rollback, observability, queue, retry, external dependency, cost, and test gaps.

## Checklist

- Spec fit: requested behavior, missing requirements, scope creep, and compatibility.
- Product: workflow, states, user trust, accessibility, business fit, and support burden.
- Architecture: boundaries, contracts, data flow, dependency weight, complexity, and maintenance.
- Security/privacy: auth, permissions, sensitive data, logging, integrations, and abuse cases.
- Operations/cost: deploy, rollback, observability, retries, queues, external services, and spend.
- Verification: tests, manual checks, migration checks, release gates, and monitoring.
