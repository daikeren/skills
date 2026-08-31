---
name: review-code
description: Performs findings-first review of code diffs, PRs, patches, or uncommitted changes, calibrating the depth and independent review lenses to the target before aggregating release risk. Use when reviewing concrete code changes for user regressions, authorization or privacy issues, architecture debt, operational risk, migration safety, missing tests, or release-safe readiness. Prefer architecture-review, product-surface-review, or security-privacy-review when the user wants one deep single-lens review rather than a full diff review.
---

# Review Code

## Review Stance

Adopt an adversarial, falsifiable stance. Treat the author's summary, comments, passing tests, and claimed safety as hypotheses rather than evidence. Try to disprove the change by tracing behavior against the authoritative contract and reachable runtime paths. Challenge the work, not the person. Use this stance only to generate and test candidate concerns: keep a finding only when concrete evidence establishes a broken invariant and consequence at a relevant location. Drop concerns that fail those checks, and accept that the correct result may be no findings.

## Workflow

1. Identify the review target: diff, PR, branch, commit range, files, or pasted patch. A complete self-contained diff or fixture supplied with a bounded review request already resolves the target; use it directly and do not run git or repository discovery unless an unresolved claim could change the verdict. In a git repository with no explicit target, review uncommitted work including staged, unstaged, and new files; for a branch or commit range, prefer a merge-base comparison when local evidence identifies the base. Confirm the target resolves and the diff is non-empty before deeper review.
2. Stay report-only. Inspect and report findings; do not edit code, tests, docs, designs, or configuration unless the user explicitly changes the task from review to fix.
3. Read the stated intent before judging the change. Use intent supplied in the task or fixture before looking for issue or PR references, commit messages, branch names, nearby docs, `docs/`, `specs/`, or project planning files. If no spec exists, review without one and say so only when that absence changes confidence or scope.
4. Find standards sources only to the depth needed to judge the target: repo instructions, contribution docs, coding standards, architecture docs, tests, CI, lint configs, generated-code conventions, and nearby code patterns. Repo standards override generic preferences; a bounded fixture need not trigger a standards search when its behavior and disposition are already self-contained.
5. Establish the authoritative contract before proposing findings. Separate product invariants, canonical fields, record-specific representations, and explicit runtime guarantees from assumptions. Treat supplied guarantees as settled unless the changed code contradicts them; do not require one record type to support identity paths that the contract assigns only to another. In a bounded snapshot, omitted mechanisms behind explicit external, caller-managed, or runtime guarantees remain unknown but constrained by those guarantees. Report a current defect when changed code directly contradicts a stated guarantee or, under documented operation semantics, creates a reachable path to a prohibited outcome. If the concern depends only on an omitted mechanism, record a material verification gap at most. Do not invent additional policy or lifecycle requirements that the authoritative contract does not establish. Do not infer a current defect solely because a field, argument, or implementation detail is absent when the authoritative contract assigns that behavior outside the bounded snapshot. When a visible operation's internal semantics are otherwise unspecified, interpret them consistently with explicit guarantees; only documented conflicting semantics or a reachable prohibited outcome establishes a contradiction.
6. Before line-level review, run a proportionate architecture-fit gate when the target adds or changes boundaries, state models, abstractions, dependencies, persistence, async ownership, generalized mechanisms, or cross-path policy. Name the required outcomes and invariants, map the proposed sources of truth and writers, and decide whether the chosen shape can satisfy them without avoidable compensating complexity. Skip the gate for a narrow change whose architecture is already settled.
7. Inspect the surrounding code, tests, docs, permissions, data flow, and user-facing behavior needed to validate the change.
8. For stateful or integration-heavy changes, reconstruct the state model and event timeline before reviewing branches line by line. Identify state precedence, canonical identity or episode boundaries, async ownership, applicable matching paths, and fallback semantics. Prefer the authoritative relation named by the contract; broaden into alternate paths only for records and states where the schema or runtime evidence makes them relevant.
9. If a second confirmed finding shares the same state, identity, ordering, fallback, ownership, or representation invariant, stop treating findings as isolated edge cases. Audit the complete target-scoped invariant surface and sibling paths, then report the shared root cause without expanding into unrelated refactoring.
10. Start with one integrated pass over the target. Use parallel subagents only when the change has multiple independent risk surfaces, the consequence justifies the extra work, and isolated review could plausibly change the verdict. Keep prompts self-contained: include the review target, diff command or pasted patch, relevant commit list, spec or intent source, standards sources, lens-specific brief, and output budget. Do not pass your suspected findings unless asking a subagent to validate a specific concern.
11. Activate only the relevant review lenses; the available set is:
   - Spec and product: missed requirements, scope creep, workflow regressions, edge states, trust, accessibility, and business impact.
   - Standards and architecture: documented standards, local idioms, architecture fit, boundaries, contracts, data flow, dependency and abstraction necessity, essential versus accidental complexity, credible alternatives, and maintainability.
   - Security and privacy: auth, permissions, sensitive data, logging, secrets, integrations, public APIs, billing/admin surfaces, and abuse cases.
   - Operations and verification: migrations, rollout, rollback, observability, queues, retries, external services, cost, tests, release gates, and monitoring.
   - State and temporal correctness, when relevant: lifecycle precedence, event ordering, stale ownership, canonical identity, previous episodes, alternate matching paths, partial data, and whether fallbacks fail safely.
   For agent discoverability, inspect only newly introduced or changed cross-file symbol names. Report names that are misleading, overly generic, or inconsistent with the repository's established term for the same concept when the ambiguity is concrete. Do not expand this check into file layout, types, comments, or untouched names, and do not request broad renames. Treat naming-only findings as non-blocking unless concrete correctness or compatibility impact supports a stronger disposition.
12. If subagents are not justified or unavailable, keep the review integrated and make additional local passes only for unresolved material claims. Do not narrate lens coverage or fallback mechanics when they add no decision-relevant information.
13. Before final aggregation, check relevant repo-local context or lessons if a lightweight store is evident, such as review notes, project memory, ADRs, or a public lessons log. Apply only lessons that match the current review target and are supported by repo evidence; do not block if no store exists.
14. Aggregate the reports. Verify each candidate finding against the authoritative contract and changed code, deduplicate overlaps, drop issues contradicted by explicit guarantees or lacking reachable impact, classify missing validation separately from current defects, and rerank blocking findings before non-blocking findings, then by severity. Unlike single-axis review, `review-code` should integrate relevant lenses into one findings-first risk order without preserving unused lens ceremony.
15. Avoid assuming a specific host, CI, framework, issue tracker, or deployment path. Infer tooling from repo evidence.
16. Preserve user work. Do not suggest reverting unrelated changes unless the user explicitly asks.
17. If no actionable findings exist, say so clearly and name only residual risk or test gaps not already settled by the supplied contract.

## Architecture Fit and Rework Lens

Use this lens when a change introduces or materially reshapes state, ownership, persistence, dependency, abstraction, or a cross-path decision.

1. Map the changed architecture before optimizing the patch: required outcomes and invariants, authoritative source of truth, owners, state and writers, runtime paths, and verification seams. Diff size and file count are not architecture evidence.
2. Challenge the problem shape. Ask whether each new abstraction, dependency, state, operation, or boundary must exist; whether an existing capability can be reused; whether the contract can be narrowed; or whether ownership or representation should change. Do not treat fewer components as automatically safer.
3. If the current shape is questionable, compare a small set of credible alternatives that includes keep-and-fix. Consider elimination, reuse, narrowing, moving ownership, changing representation, replacing the mechanism, or a bounded rewrite only when each is relevant. Compare invariant fit, lifecycle complexity, compatibility, reversibility, and verification instead of brainstorming architectures without a decision.
4. Distinguish necessary complexity from compensating complexity. Separate transaction, provider, durability, authorization, or recovery boundaries that must remain from duplicated decisions, materialized projections, multiple writers, reconciliation, fallbacks, and branches created by the chosen model.
5. When several reachable defects share an ownership, source-of-truth, or representation flaw, report the architectural root cause rather than prescribing a sequence of local patches. Incremental repair is not preferred when it preserves the mechanism that causes the failures.
6. Recommend architectural rework at the finding's independently supported disposition. Use `Block — architectural rework required` only when concrete evidence shows that the structural root cause itself meets the blocking threshold, such as reachable serious harm, repeated reachable invariant failures, or a missing required high-risk release gate. Recurring complexity without a current blocking defect can justify a non-blocking rework direction but cannot make the release verdict `Block`. State at least one feasible target shape, the bounded rewrite surface, what can be reused, what should be discarded, and how the replacement would be verified. Do not demand a rewrite for style, hypothetical scale, or reviewer preference.

## Stateful Integration Lens

Use this lens when a change combines lifecycle states, async work, retries or fallbacks, time ordering, or several ways to identify the same entity.

1. Write the shortest event timeline that can explain the behavior, including creation, activation, persistence, retry, reply, timeout, and cleanup steps that matter. For every eligibility or ordering predicate, name the semantic event its boundary is meant to represent and verify that the code uses that event's authoritative timestamp and intended strictness; a nearby object's timestamp is not equivalent. Test alternate orderings instead of trusting call-site order at a glance.
2. Identify the canonical source of truth, identity, and episode boundary from the authoritative contract. Map each alternate field or lookup path to the record type and lifecycle state where it is valid. If several applicable paths represent the same entity, verify that per-path filtering or ranking cannot hide a globally newer or more authoritative candidate; do not broaden the path set beyond the supplied schema.
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

When evidence uncertainty changes a finding or verdict, use confidence labels:

- High: directly observed in code, diff, design, or behavior with an unambiguous trace to impact.
- Medium: supported by concrete evidence, but one assumption remains about runtime behavior, configuration, user path, or intended policy.
- Low: plausible risk with incomplete evidence; keep the impact severity conditional and state the assumption or open question that needs validation.

When reachability or tail risk changes a finding or verdict, use likelihood separately from confidence:

- High: common or broadly exposed path with few preconditions.
- Medium: reachable path with meaningful preconditions.
- Low: uncommon timing, state, configuration, or user sequence.

Assign an explicit disposition to every finding:

- `Blocking`: must be fixed or explicitly risk-accepted before merge or release.
- `Non-blocking`: actionable in the current review, but safe to merge as-is.
- `Follow-up`: not required for this change and concrete enough for a separate ticket.

Do not infer disposition from severity or likelihood alone. A low-likelihood issue remains blocking when the consequence is catastrophic or difficult to contain or recover from, including authorization or privacy breaches, cross-tenant exposure, data loss, duplicate or incorrect financial effects, destructive migrations, or irreversible actions. A low-likelihood, limited, recoverable degraded-UX case is usually non-blocking or a follow-up. Missing validation blocks only when it is a required release gate or leaves a credible high-consequence risk unresolved.

Each finding must communicate impact, release disposition, evidence, and the smallest credible fix direction. State confidence or occurrence likelihood explicitly only when uncertainty, rarity, or tail risk changes the verdict; keep them distinct from impact severity and disposition when used. Use explicit type (`current defect/regression`, `missing validation`, or `optional improvement`) only when it prevents ambiguity or helps aggregate several findings. All blocking dispositions require concrete evidence of a reachable risk or a missing required high-risk release gate: cite a file:line or surface reference plus a short quote or paraphrase of the offending line, state, behavior, or validation gap when available. If reachability cannot be supported, move the item to assumptions or open questions rather than blocking. Recommend a follow-up ticket only when the work is independently actionable; state why it can wait and give a completion or verification signal. Do not turn low-confidence speculation into ticket backlog.

Scale the presentation to the target. One clear finding may be one compact paragraph or bullet containing the required judgment; it does not need repeated headings, a lens-coverage summary, or generic validation suggestions that do not change the verdict. Spend detail on causal evidence, impact, and the fix rather than on review-process narration. Example finding:

When the architecture itself independently qualifies as a blocking defect, keep the normal `Block` verdict and mark the finding `architectural rework required`. Otherwise preserve the supported non-blocking disposition even when rework is the preferred direction. The smallest credible fix may be a bounded rewrite rather than the smallest diff. Describe the target ownership, truth, state, and boundaries without designing every implementation detail inside the review.

When the user asks only for the release disposition of one bounded finding, answer with the verdict and one compact evidence-impact-fix paragraph. When confidence or likelihood changes the judgment, keep it distinct from disposition; otherwise omit it along with redundant headings, lens coverage, change summaries, and open-question sections.

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
- For a broad review, concise coverage only when it helps a reader understand material scope or an evidence gap. Omit process narration for a bounded review.
- Change summary only when the user requested it or it materially helps explain the target; place it after findings.
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
- Architecture fit: required outcomes and invariants, sources of truth, owners, state writers, boundaries, contracts, and data flow are coherent before local implementation details are accepted.
- Necessity and alternatives: new abstractions, dependencies, state, and generalized mechanisms are justified; credible alternatives include keep-and-fix and are compared by evidence, lifecycle complexity, compatibility, and reversibility.
- Architectural rework: shared structural defects are reported as a bounded root-cause finding rather than compensating patches; rewrite recommendations identify a feasible target shape and are not based on style or diff size.
- Symbol naming: newly introduced or changed cross-file symbols are not misleading, overly generic, or inconsistent with established domain terms; naming-only findings remain narrow and non-blocking without concrete correctness or compatibility impact.
- State/identity: precedence, canonical source, episode boundary, event order, async ownership, and alternate matching paths.
- Fallbacks: prior-episode and partial-data behavior; uncertainty must not become consequential success.
- Security/privacy: auth, permissions, sensitive data, logging, integrations, and abuse cases.
- Operations/cost: deploy, rollback, observability, retries, queues, external services, and spend.
- Verification: table, transition, timeline, race, contract, and permission tests where relevant; manual checks, migration checks, release gates, and monitoring.
- Omitted mechanisms: before finalizing, reconcile each finding based on an absent field, argument, or mechanism against explicit external, caller-managed, and runtime guarantees. If a guarantee resolves that concern, remove it as a defect and do not condition approval on re-proving the omitted implementation. Retain such a finding only when visible code or documented operation semantics show a bypass, conflicting data flow, or another concrete reachable violation.
- Release disposition: every finding distinguishes impact from merge/release blocking status; state evidence confidence or occurrence likelihood when either changes the judgment.
- Tail risk: low likelihood does not downgrade catastrophic, irreversible, cross-tenant, authorization, privacy, data-loss, or financial harm into a non-blocker.
