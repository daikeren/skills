---
name: review-code
description: Performs findings-first review of code diffs, PRs, patches, or uncommitted changes, using parallel subagents when available to isolate spec fit, architecture, security/privacy, operations, and verification lenses before aggregation. Use when reviewing concrete code changes for user regressions, authorization or privacy issues, architecture debt, operational risk, migration safety, missing tests, or release-safe readiness. Prefer architecture-review, product-surface-review, or security-privacy-review when the user wants one deep single-lens review rather than a full diff review.
---

# Review Code

## Workflow

1. Identify the review target: diff, PR, branch, commit range, files, or pasted patch. In a git repository with no explicit target, review uncommitted work including staged, unstaged, and new files; for a branch or commit range, prefer a merge-base comparison when local evidence identifies the base. Confirm the target resolves and the diff is non-empty before deeper review.
2. Stay report-only. Inspect and report findings; do not edit code, tests, docs, designs, or configuration unless the user explicitly changes the task from review to fix.
3. Read the stated intent before judging the change. Look for a spec source in user text, issue or PR references, commit messages, branch names, nearby docs, `docs/`, `specs/`, or project planning files. If no spec exists, review without one and say so.
4. Find standards sources: repo instructions, contribution docs, coding standards, architecture docs, tests, CI, lint configs, generated-code conventions, and nearby code patterns. Repo standards override generic preferences.
5. Inspect the surrounding code, tests, docs, permissions, data flow, and user-facing behavior needed to validate the change.
6. For stateful or integration-heavy changes, reconstruct the state model and event timeline before reviewing branches line by line. Identify state precedence, canonical identity or episode boundaries, async ownership, alternate matching paths, and fallback semantics.
7. If a second confirmed finding shares the same state, identity, ordering, or fallback invariant, stop treating findings as isolated edge cases. Audit the complete target-scoped invariant surface and sibling paths, then report the shared root cause without expanding into unrelated refactoring.
8. For non-trivial reviews, launch parallel subagents when the harness provides them. Keep prompts self-contained: include the review target, diff command or pasted patch, relevant commit list, spec or intent source, standards sources, lens-specific brief, and output budget. Do not pass your suspected findings unless asking a subagent to validate a specific concern.
9. Use at least these independent lenses:
   - Spec and product: missed requirements, scope creep, workflow regressions, edge states, trust, accessibility, and business impact.
   - Standards and architecture: documented standards, local idioms, boundaries, contracts, data flow, dependency weight, complexity, and maintainability.
   - Security and privacy: auth, permissions, sensitive data, logging, secrets, integrations, public APIs, billing/admin surfaces, and abuse cases.
   - Operations and verification: migrations, rollout, rollback, observability, queues, retries, external services, cost, tests, release gates, and monitoring.
   - State and temporal correctness, when relevant: lifecycle precedence, event ordering, stale ownership, canonical identity, previous episodes, alternate matching paths, partial data, and whether fallbacks fail safely.
   For agent discoverability, inspect only newly introduced or changed cross-file symbol names. Report names that are misleading, overly generic, or inconsistent with the repository's established term for the same concept when the ambiguity is concrete. Do not expand this check into file layout, types, comments, or untouched names, and do not request broad renames. Treat naming-only findings as non-blocking unless concrete correctness or compatibility impact supports a stronger disposition.
10. If subagents are unavailable or the diff is tiny, run the relevant lenses as isolated local passes. Do not narrate lens coverage or fallback mechanics when they add no decision-relevant information to a narrow review.
11. Before final aggregation, check relevant repo-local context or lessons if a lightweight store is evident, such as review notes, project memory, ADRs, or a public lessons log. Apply only lessons that match the current review target and are supported by repo evidence; do not block if no store exists.
12. Aggregate the reports. Verify each candidate finding against the code or diff, deduplicate overlaps, drop speculative issues that lack impact, classify missing validation separately from current defects, and rerank blocking findings before non-blocking findings, then by severity. Unlike single-axis review, `review-code` should integrate the lenses into one findings-first risk order while preserving useful lens context.
13. Avoid assuming a specific host, CI, framework, issue tracker, or deployment path. Infer tooling from repo evidence.
14. Preserve user work. Do not suggest reverting unrelated changes unless the user explicitly asks.
15. If no actionable findings exist, say so clearly and name any residual risk or test gap.

## Stateful Integration Lens

Use this lens when a change combines lifecycle states, async work, retries or fallbacks, time ordering, or several ways to identify the same entity.

1. Write the shortest event timeline that can explain the behavior, including creation, activation, persistence, retry, reply, timeout, and cleanup steps that matter. Test alternate orderings instead of trusting call-site order at a glance.
2. Identify the canonical source of truth, identity, and episode boundary. If several fields or lookup paths represent the same entity, verify that per-path filtering or ranking cannot hide a globally newer or more authoritative candidate; combine candidates first when eligibility depends on that global ordering.
3. Distinguish loading, unavailable, error, empty, success, historical, and active states. Check precedence explicitly instead of inferring it from scattered booleans or nullable values.
4. Challenge fallbacks with prior workspace, account, request, history, episode, and legacy-data scenarios. A broad fallback must not turn unknown state into a consequential success such as cleared, authorized, paid, published, or deleted.
5. Inspect ownership across async boundaries: cancellation, request generation, idempotency, late responses, partial persistence, retries, and swallowed errors.
6. Compare tests with the model. End-state examples alone are insufficient when transition, race, timeline, or cross-path behavior is the risk; expect table-driven or adversarial regression coverage for the reachable invariant.

## Output

Lead with a release verdict, then findings with blocking items first and severity order within each group:

- `Block`: at least one finding must be resolved or explicitly risk-accepted before merge or release.
- `Approve with follow-ups`: no blocking findings, but non-blocking work remains.
- `Approve`: no actionable findings.

Use severity for impact if the issue occurs, independent of whether it blocks this release:

- `[P0]` catastrophic impact such as active compromise, irrecoverable data loss, widespread outage, or irreversible destructive behavior.
- `[P1]` serious user or business harm, authorization/privacy break, migration corruption, or major operational failure.
- `[P2]` moderate bug, missing guardrail, important test gap, or maintainability issue with plausible near-term cost.
- `[P3]` low-risk issue that still affects correctness, clarity, or future review.

Use confidence labels:

- High: directly observed in code, diff, design, or behavior with an unambiguous trace to impact.
- Medium: supported by concrete evidence, but one assumption remains about runtime behavior, configuration, user path, or intended policy.
- Low: plausible risk with incomplete evidence; keep the impact severity conditional and state the assumption or open question that needs validation.

Use likelihood separately from confidence:

- High: common or broadly exposed path with few preconditions.
- Medium: reachable path with meaningful preconditions.
- Low: uncommon timing, state, configuration, or user sequence.

Assign an explicit disposition to every finding:

- `Blocking`: must be fixed or explicitly risk-accepted before merge or release.
- `Non-blocking`: actionable in the current review, but safe to merge as-is.
- `Follow-up`: not required for this change and concrete enough for a separate ticket.

Do not infer disposition from severity or likelihood alone. A low-likelihood issue remains blocking when the consequence is catastrophic or difficult to contain or recover from, including authorization or privacy breaches, cross-tenant exposure, data loss, duplicate or incorrect financial effects, destructive migrations, or irreversible actions. A low-likelihood, limited, recoverable degraded-UX case is usually non-blocking or a follow-up. Missing validation blocks only when it is a required release gate or leaves a credible high-consequence risk unresolved.

Each finding must communicate the impact, evidence confidence, occurrence likelihood, release disposition, evidence, and smallest credible fix direction when those dimensions affect judgment. Labels are a compact aid, not mandatory ceremony: for a bounded one-finding review where the dimensions are obvious and uncontested, state the verdict, reachable path, impact, fix, and verification in one compact finding. Use explicit severity, confidence, likelihood, disposition, and type (`current defect/regression`, `missing validation`, or `optional improvement`) when they prevent ambiguity, calibrate a disputed risk, or help aggregate multiple findings. Keep severity tied to conditional impact rather than evidence certainty. All blocking dispositions require concrete evidence of a reachable risk or a missing required high-risk release gate: cite a file:line or surface reference plus a short quote or paraphrase of the offending line, state, behavior, or validation gap when available. If reachability cannot be supported, keep the severity conditional, lower confidence, and move the item to assumptions or open questions rather than blocking. Recommend a follow-up ticket only when the work is independently actionable; state why it can wait and give a completion or verification signal. Do not turn low-confidence speculation into ticket backlog.

Scale the presentation to the target. One clear finding may be one compact paragraph or bullet containing the required judgment; it does not need repeated headings, a lens-coverage summary, or generic validation suggestions that do not change the verdict. Spend detail on causal evidence, impact, and the fix rather than on review-process narration. Example finding:

When the user asks only for the release disposition of one bounded finding, answer with the verdict and one compact evidence-impact-fix paragraph. Omit classification labels, coverage summaries, change summaries, and open-question sections unless one of them changes or qualifies the disposition.

```text
[P1][High confidence][Low likelihood][Blocking] api/routes.py:88 - Admin export
lacks a server-side role check. Type: current regression. Evidence: the handler
only checks `is_authenticated` before returning customer export data. Impact:
any signed-in user who discovers the route can export customer data. Fix:
enforce the admin permission and add a non-admin 403 test.
```

Then include:

- Explicitly say `No blocking findings` when the verdict is not `Block`.
- Open questions or assumptions that affect a finding or readiness.
- For a non-trivial review, concise coverage: target reviewed, spec or intent source, standards sources, and subagents or local passes used. Omit this process summary for a narrow review when it adds no decision value.
- Change summary, only after findings.
- Verification reviewed or missing when it affects confidence or release readiness.

## Subagent Briefs

Ask subagents for concise findings only. Budget each subagent to at most 5 findings and about 400 words. Require the format `[severity][confidence][likelihood][disposition] location/surface - issue`, followed by evidence, impact, and fix direction. Tell subagents to classify each item as a current defect/regression, missing validation, or optional improvement; keep impact severity separate from confidence, likelihood, and release disposition; and use `Blocking` only when concrete evidence of reachability or a missing required high-risk gate is cited. Do not pass your suspected findings unless asking a subagent to validate a specific concern. Useful briefs:

- Spec and product reviewer: compare the diff with the requested behavior; report missing requirements, wrong behavior, scope creep, and user-facing regressions.
- Standards and architecture reviewer: compare the diff with repo standards and local patterns; report boundary, contract, data-flow, complexity, or maintainability risks.
- Security and privacy reviewer: inspect trust boundaries and sensitive data paths; report authorization, exposure, logging, secrets, integration, public API, billing, or abuse risks.
- Operations and verification reviewer: inspect release safety; report migration, rollback, observability, queue, retry, external dependency, cost, and test gaps.
- State and temporal reviewer: for stateful changes, reconstruct the event timeline and state precedence; challenge canonical identity, async ownership, alternate matching paths, prior episodes, partial persistence, and fallback behavior. Fold this into the architecture or operations pass when concurrency is limited.

## Checklist

- Spec fit: requested behavior, missing requirements, scope creep, and compatibility.
- Product: workflow, states, user trust, accessibility, business fit, and support burden.
- Architecture: boundaries, contracts, data flow, dependency weight, complexity, and maintenance.
- Symbol naming: newly introduced or changed cross-file symbols are not misleading, overly generic, or inconsistent with established domain terms; naming-only findings remain narrow and non-blocking without concrete correctness or compatibility impact.
- State/identity: precedence, canonical source, episode boundary, event order, async ownership, and alternate matching paths.
- Fallbacks: prior-episode and partial-data behavior; uncertainty must not become consequential success.
- Security/privacy: auth, permissions, sensitive data, logging, integrations, and abuse cases.
- Operations/cost: deploy, rollback, observability, retries, queues, external services, and spend.
- Verification: table, transition, timeline, race, contract, and permission tests where relevant; manual checks, migration checks, release gates, and monitoring.
- Release disposition: every finding distinguishes impact, evidence confidence, occurrence likelihood, and merge/release blocking status.
- Tail risk: low likelihood does not downgrade catastrophic, irreversible, cross-tenant, authorization, privacy, data-loss, or financial harm into a non-blocker.
