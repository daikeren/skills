---
name: review-code
description: Use when reviewing a concrete code diff, PR, patch, or uncommitted changes for bugs and release readiness across product, architecture, security, operations, and verification.
---

# Review Code

## Workflow

Stay report-only unless the user changes the task to a fix. Resolve the requested diff, PR, branch, commit range, files, or patch before reviewing. With no explicit target in a Git repository, inspect staged, unstaged, and new files; use a merge-base comparison for a branch when local evidence identifies its base. A complete bounded fixture needs no unrelated repository discovery.

Establish intent, applicable repository standards, and the authoritative contract. Inspect surrounding code, callers, tests, permissions, and runtime paths only where they could change the verdict. Consult prior lessons only when they could resolve a material question. Infer tooling from repository evidence and preserve unrelated user work.

Treat summaries, comments, tests, and safety claims as hypotheses. Try to falsify them against reachable behavior, then discard concerns that lack a broken invariant and consequence. Explicit external, caller-managed, or runtime guarantees constrain a bounded snapshot: an omitted field or mechanism alone is not a defect. Keep a finding only when visible code or documented operation semantics contradict the guarantee or establish a prohibited outcome. Record material verification gaps separately; do not invent requirements or demand re-proof of settled guarantees.

Start with one integrated pass and activate only relevant lenses:

- Spec and product: requested behavior, scope, compatibility, user states, accessibility, and recovery.
- Architecture: boundaries, contracts, ownership, data flow, dependencies, and complexity. When a change reshapes state, persistence, abstractions, or cross-path policy, read [architecture-fit.md](references/architecture-fit.md) before prescribing local repairs.
- Security and privacy: authorization, sensitive data, logging, secrets, integrations, and abuse paths.
- Operations and verification: migrations, rollback, queues, retries, cost, and evidence needed for release.
- State and time: when lifecycle precedence, identity paths, async ownership, retries, or consequential fallbacks affect correctness, read [stateful-integrations.md](references/stateful-integrations.md) and reconstruct the relevant event timeline.

When a second confirmed finding shares a state, identity, ordering, fallback, ownership, or representation invariant, inspect its target-scoped sibling paths and report the shared cause. Do not expand into unrelated refactoring. Check changed cross-file names only when concrete ambiguity makes code misleading or harder to retrieve; naming alone is non-blocking without correctness or compatibility impact.

Use independent subagents only when independent risk surfaces and consequences justify them or repository instructions require them. Read [independent-review.md](references/independent-review.md) when delegating. Otherwise resolve material open claims in the integrated review, without narrating unused lenses.

Before reporting, reconcile each candidate finding with the contract, explicit guarantees, and reachable code. Deduplicate shared causes and distinguish current defects, missing validation, and optional improvements. A clean review is a valid result.

## Output

Lead with the release verdict, then findings with blocking items first and severity order within each group:

- `Block`: a reachable material risk or missing required high-risk gate must be resolved or explicitly risk-accepted.
- `Approve with follow-ups`: actionable non-blocking work remains.
- `Approve`: no actionable findings. Say `No blocking findings` for either non-blocking verdict.

Severity describes impact if the issue occurs: P0 for catastrophic or irreversible harm, P1 for serious user/business harm or authorization/privacy breaks, P2 for moderate bugs or meaningful validation/maintenance gaps, and P3 for low-risk correctness or clarity issues. Disposition is separate: `Blocking`, `Non-blocking`, or `Follow-up`.

Low likelihood does not make cross-tenant exposure, authorization/privacy failures, data loss, incorrect financial effects, or destructive migrations non-blocking. A limited, recoverable low-likelihood UX issue is usually non-blocking. Missing validation blocks only when it is a required release gate or leaves a credible high-consequence risk unresolved.

For each finding, provide a precise location, causal evidence, impact, disposition, and smallest credible fix. Blocking requires concrete reachability or a missing required high-risk gate. State confidence and occurrence likelihood separately only when uncertainty, rarity, or tail risk changes the judgment. Unsupported concerns belong in assumptions or open questions, not a blocking finding or speculative ticket backlog.

Architectural rework inherits the finding's supported disposition. Use `Block — architectural rework required` only when the structural cause independently meets the blocking threshold. Otherwise keep the rework non-blocking. Identify a feasible bounded target shape and its verification, not a complete redesign.

One finding can be one compact paragraph. Include open questions, verification gaps, or scope notes only when they affect the decision. Summarize the change only when requested or necessary to explain a finding. For an independently actionable follow-up, say why it can wait and how completion will be verified.
