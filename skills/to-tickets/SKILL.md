---
name: to-tickets
description: Breaks a spec, plan, or conversation into independently reviewable, mergeable, and releasable tickets. Use when planning implementation slices, release sequencing, migrations, compatibility layers, feature flags, cleanup follow-ups, or tracer-bullet work that should land safely in small increments.
---

# To Tickets

## Workflow

1. Read the source spec, plan, prototype notes, or conversation. Fetch referenced files or issues when available, and use the project's domain vocabulary and ADRs when local evidence provides them.
2. Check repo-local context, lessons, glossary, ADRs, or similar stores before choosing slice boundaries.
3. Explore the codebase only enough to understand current state, stable interfaces, similar prior art, and enabling refactors that would make the work safer. Avoid speculative cleanup.
4. Scale depth to risk. Low-risk, solo, reversible work can use a lightweight ticket list; cross-functional, irreversible, sensitive-data, migration, security, or compliance work needs explicit gates, owners, rollout, and rollback.
5. Identify the release path before slicing: compatibility, data migration, user-visible rollout, permission changes, and cleanup.
6. Prefer tracer-bullet vertical increments: each slice cuts a narrow but complete path through the relevant layers and is demoable or verifiable on its own.
7. Size tickets for a fresh agent context window. If a ticket needs too much retained context, split it or make the dependency edge explicit.
8. Give every ticket blocking edges. A ticket with no blockers is part of the frontier and can start immediately.
9. Use expand-contract sequencing for wide refactors, schema migrations, API transitions, or compatibility changes. Expand the new path beside the old one, migrate callers in safe batches, then contract the old path after all blockers are clear.
10. Make each ticket independently reviewable and mergeable. If a ticket cannot be released independently, say what gate, flag, integration branch, or final verify ticket makes that safe.
11. Human owns release, priority, policy, and irreversible decisions; agent owns dependencies, facts, and risks. If the user is absent, proceed only with explicitly recorded low-risk assumptions and leave high-risk decisions as blockers.
12. Include tests and verification per ticket. Add cleanup follow-ups only after compatibility and rollout are safe.
13. For cross-session handoff, prefer the repo's existing ticket convention. If none exists, propose a path and minimal frontmatter instead of forcing file creation.
14. Before treating the list as final, check granularity: too coarse, too fine, wrong blockers, or tickets that should be merged or split. If the user is not available, include those as review questions.
15. Order tickets by blockers and release sequence, not by architecture layers.

## Output

Return:

- Release strategy: how the work gets safely from current state to shipped state.
- Ticket list: dependency-ordered tickets with title, what it delivers, `Blocked by`, acceptance criteria, verification, rollout notes, and rollback risk.
- Frontier: tickets whose blockers are all clear and can start immediately.
- Granularity check: merge/split questions and any uncertain blocking edges.
- Decisions and assumptions: user-owned choices, blockers, and any low-risk assumptions used.
- Handoff artifact: existing repo location, or proposed path and frontmatter when tickets should cross sessions.
- Cleanup: explicit follow-ups that should wait until the new path is proven.

Keep ticket descriptions user- and behavior-centered. Avoid brittle file paths unless they identify stable interfaces.

Example ticket:

```text
Ticket 2 - Accept both payload formats (expand). Delivers: API accepts legacy and
new payloads behind a flag. Blocked by: Ticket 1 (schema). Acceptance: both formats
round-trip in integration tests. Rollback: disable the flag.
```
