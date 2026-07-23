---
name: route-work
description: Routes product and engineering work to the right focused skill. Use when the user is unsure which skill fits, asks for routing help, or needs a daily flow across scoping, options, specs, tickets, implementation, change understanding, review, and compound learning.
---

# Route Work

## Workflow

1. Identify the user's current phase and route to one focused skill. Unless the user explicitly asks only for routing advice, treat the route as a brief preface and continue into the selected skill in the same response.
2. If the user wants to learn a concrete code change well enough to participate in later work, route to `understand-change`. If the task is to judge a change, route directly to the right review skill: architecture, product surface, security/privacy, or code review.
3. Check repo-local context, lessons, glossary, ADRs, or similar stores when routing depends on local decisions or conventions.
4. Scale depth to risk. Low-risk, solo, reversible work can take the lightest ready path; cross-functional, irreversible, sensitive-data, migration, security, or compliance work needs the standard or deeper path.
5. Human owns decisions; agent owns routing facts, gaps, and assumptions. If the user is absent, route only when readiness facts are enough and assumptions are low-risk.
6. Prefer the earliest missing readiness gate in the daily flow: scope -> options -> spec -> tickets -> implementation -> optional change understanding -> review -> compound learning.
7. If the task needs current external facts, route to `research-brief` before deciding.
8. Apply a fidelity gate before routing to more planning or production work. Use the lowest fidelity that can answer the current question: stay with discussion, scoping, options, or a spec when words and existing evidence are enough; route to `prototype` when the decision depends on seeing, feeling, exercising, or measuring an artifact, such as interaction behavior, a state model, data shape, or integration feasibility. Do not route to `prototype` merely because code is cheap or the work is large.
9. State the chosen skill and why, then apply that skill's workflow. Stop at a handoff only when the user asked for routing alone or the selected skill requires a missing user-owned decision.

## Output

By default, return:

- Route preface: selected skill and a one-sentence reason.
- Downstream result: the selected skill's normal output.

When the user explicitly asks only for routing, return:

- Route: selected skill.
- Reason: one sentence.
- Assumptions: any safe assumption used to route without more user input.
- Handoff: the immediate instruction to apply that skill.

Example routing-only response:

```text
Route: to-tickets
Reason: a reviewed spec exists; the missing phase is slicing for release.
Handoff: break the payment-retry spec into independently releasable tickets.
```

## Readiness Gates

- Scope is ready when the problem, stakeholders, success signal, constraints, and risk level are clear enough for the next move.
- Options are ready when the decision frame is known and the user needs a choice among real paths.
- Spec is ready when a direction is chosen and behavior, contracts, constraints, rollout, and validation can be written down.
- Tickets are ready when the plan is stable enough to slice by blockers, release order, and verification.
- Implementation is ready when desired behavior, ownership boundaries, safety concerns, and a verification path are understood.
- Change understanding is ready when the learner can explain the intent, key runtime or data path, an important invariant, a principal trade-off, and how to verify or extend the change.
- Review is ready when there is a diff, design, artifact, or release surface to inspect.
- Compound learning is ready when completed work produced a validated, reusable lesson.

Hard boundaries: route later phases only when their readiness conditions are met. Do not route review requests into implementation, and do not route high-risk work past scoping or spec without an explicit user decision.
