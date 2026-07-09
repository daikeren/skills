---
name: cto
description: Routes CTO-grade product and engineering work to the right focused skill. Use when the user asks for CTO help, is unsure which skill fits, or needs a daily flow across intake, options, spec, tickets, implementation stewardship, review, and compound learning.
---

# CTO Router

## Workflow

1. Identify the user's current phase and route to one focused skill.
2. Prefer the earliest missing phase in the daily flow: intake -> options -> spec -> tickets -> implementation stewardship -> executive review -> compound learning.
3. If the task is a review, route directly to the right review skill: architecture, product surface, security/privacy, or executive code review.
4. If the task needs current external facts, route to `research-brief` before deciding.
5. If uncertainty can be reduced faster by a disposable proof, route to `prototype`.
6. State the chosen skill and why, then follow that skill's workflow.

## Output

Return:

- Route: selected skill.
- Reason: one sentence.
- Handoff: the immediate instruction to apply that skill.

Example route:

```text
Route: to-tickets
Reason: a reviewed spec exists; the missing phase is slicing for release.
Handoff: break the payment-retry spec into independently releasable tickets.
```

## Checklist

- Do not run multiple phases by default.
- Do not skip intake when goals, stakeholders, or risk are unclear.
- Do not create tickets before a direction or spec is stable.
- Do not implement before release, migration, security, and verification risks are understood.
