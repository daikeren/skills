---
name: to-tickets
description: Breaks a spec, plan, or conversation into independently reviewable, mergeable, and releasable tickets. Use when planning implementation slices, release sequencing, migrations, compatibility layers, feature flags, cleanup follow-ups, or tracer-bullet work that should land safely in small increments.
---

# To Tickets

## Workflow

1. Read the source spec, plan, prototype notes, or conversation. Fetch referenced files or issues when available.
2. Identify the release path before slicing: compatibility, data migration, user-visible rollout, permission changes, and cleanup.
3. Prefer thin vertical increments that deliver end-to-end behavior across data, API, UI, tests, and docs when relevant.
4. Use expand-contract sequencing for wide refactors, schema migrations, API transitions, or compatibility changes.
5. Make each ticket independently reviewable and mergeable. If a ticket cannot be released independently, say what gate or integration branch makes that safe.
6. Include tests and verification per ticket. Add cleanup follow-ups only after compatibility and rollout are safe.
7. Order tickets by blockers and release sequence, not by architecture layers.

## Output

Return:

- Release strategy: how the work gets safely from current state to shipped state.
- Ticket list: dependency-ordered tickets with title, what it delivers, blockers, acceptance criteria, verification, rollout notes, and rollback risk.
- Frontier: tickets that can start immediately.
- Cleanup: explicit follow-ups that should wait until the new path is proven.

Keep ticket descriptions user- and behavior-centered. Avoid brittle file paths unless they identify stable interfaces.

Example ticket:

```text
Ticket 2 - Accept both payload formats (expand). Delivers: API accepts legacy and
new payloads behind a flag. Blockers: Ticket 1 (schema). Acceptance: both formats
round-trip in integration tests. Rollback: disable the flag.
```
