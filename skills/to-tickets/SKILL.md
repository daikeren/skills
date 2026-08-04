---
name: to-tickets
description: Breaks a spec, plan, or settled conversation into independently reviewable, mergeable, and releasable tickets or issue descriptions. Use when drafting or revising implementation issue descriptions from settled delivery context, planning implementation slices, release sequencing, migrations, compatibility layers, feature flags, cleanup follow-ups, or tracer-bullet work that should land safely in small increments.
---

# To Tickets

## Workflow

1. Read the source spec, plan, prototype notes, or conversation. Identify which decisions are accepted, proposed, or still open; do not silently drop or reopen accepted decisions while slicing. For a complete, routine, settled change, use the supplied scope and established pattern directly. Fetch referenced files or issues only when they can change the slice, and use the project's domain vocabulary and ADRs when local evidence provides them.
2. Identify the target artifact and audience. A tracker issue is an outcome contract: why the work matters, what behavior must hold, scope and non-goals, observable acceptance, real dependencies, and release constraints. Carry accepted decisions that an implementer must not reopen as concise decision constraints; reference their authoritative spec or ADR when one exists, and capture them directly when no durable source exists. Do not copy their rationale or turn the issue description into an implementation spec.
3. Check repo-local context, lessons, glossary, ADRs, or similar stores before choosing slice boundaries.
4. Explore the codebase only enough to understand current state, stable interfaces, similar prior art, and enabling refactors that would make the work safer. Avoid speculative cleanup.
5. Scale depth to risk. Low-risk, solo, reversible work can use a lightweight ticket list; cross-functional, irreversible, sensitive-data, migration, security, or compliance work needs explicit gates, owners, rollout, and rollback.
6. Before slicing, sketch unresolved runtime order, ownership, key contracts, invariants, and verification seams only when a wrong internal shape would cause material rework. Reuse a settled local pattern; skip routine work. When a delivery, idempotency, or at-most-once guarantee spans retries or separate durability and side-effect boundaries, identify the actual mechanism—such as a transaction, uniqueness constraint, stable provider key, idempotent operation, claim lifecycle, or acknowledgement—and challenge its relevant failure windows. Do not assume a claim → effect → completion template when the system uses another mechanism; leave an unresolved guarantee as a blocker instead of embedding a false invariant in the tickets. Keep internal program shape in a separate implementation plan or handoff; include it in an issue description only when it is an approved constraint or observable acceptance boundary.
7. Identify the release path before slicing: compatibility, data migration, user-visible rollout, permission changes, and cleanup.
8. Prefer tracer-bullet vertical increments: each slice cuts a narrow but complete path through the relevant layers and is demoable or verifiable on its own.
9. Size tickets for a fresh agent context window. If a ticket needs too much retained context, split it or make the dependency edge explicit.
10. Give every ticket blocking edges. A ticket with no blockers is part of the frontier and can start immediately.
11. Use expand-contract sequencing for wide refactors, schema migrations, API transitions, or compatibility changes. Expand the new path beside the old one, migrate callers in safe batches, then contract the old path after all blockers are clear.
12. Make each ticket independently reviewable and mergeable. If a ticket cannot be released independently, say what gate, flag, integration branch, or final verify ticket makes that safe.
13. Human owns release, priority, policy, and irreversible decisions; agent owns dependencies, facts, and risks. If the user is absent, proceed only with explicitly recorded low-risk assumptions and leave high-risk decisions as blockers.
14. Include tests and verification per ticket. Add cleanup follow-ups only after compatibility and rollout are safe.
15. For cross-session handoff, prefer the repo's existing ticket convention. If none exists, propose a path and minimal frontmatter instead of forcing file creation.
16. Before treating the list as final, check granularity: too coarse, too fine, wrong blockers, or tickets that should be merged or split. If the user is not available, include those as review questions.
17. Order tickets by blockers and release sequence, not by architecture layers.

## Output

For routine settled work that is safely one ticket, return that ticket directly with its outcome, acceptance signal, focused verification, and any real release note. Omit release strategy, program shape, frontier, granularity, handoff, and cleanup sections when they add no decision or delivery value.

For multi-ticket or consequential work, return the useful subset of:

- Release strategy: how the work gets safely from current state to shipped state.
- Program shape, when needed.
- Ticket list: dependency-ordered tickets with title, what it delivers, `Blocked by`, acceptance criteria, verification, rollout notes, and rollback risk.
- Frontier: tickets whose blockers are all clear and can start immediately.
- Granularity check: merge/split questions and any uncertain blocking edges.
- Decisions and assumptions: user-owned choices, blockers, and any low-risk assumptions used.
- Decision handoff, when tickets inherit prior decisions: authoritative source when one exists, accepted constraints each ticket inherits, and open questions it must not silently decide.
- Handoff artifact: existing repo location, or proposed path and frontmatter when tickets should cross sessions.
- Cleanup: explicit follow-ups that should wait until the new path is proven.

Keep ticket descriptions user- and behavior-centered. For an issue description, omit proposed storage locations, internal schema or enum names, modules, classes, functions, transaction or locking mechanics, resolver placement, indexes, repair algorithms, call trees, and test implementation. Retain an internal detail only when it is an accepted hard-to-reverse constraint, a stable external interface, or necessary to make acceptance unambiguous. State that constraint at the minimum level needed to prevent re-litigation, reference its authoritative source when available, and leave rationale and mechanics in the spec, ADR, plan, or handoff. Avoid brittle file paths unless they identify stable interfaces.

Example ticket:

```text
Ticket 2 - Accept both payload formats (expand). Delivers: API accepts legacy and
new payloads behind a flag. Blocked by: Ticket 1 (schema). Acceptance: both formats
round-trip in integration tests. Rollback: disable the flag.
```
