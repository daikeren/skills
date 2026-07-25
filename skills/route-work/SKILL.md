---
name: route-work
description: Recommends a proportionate path for product and engineering work. Use when the user is unsure what capability or skill fits, asks for routing help, or needs a suggested flow across scoping, research, prototyping, decisions, specs, tickets, implementation, change understanding, review, and learning. Treat the repository's skills as available options rather than a closed world.
---

# Route Work

## Workflow

1. Identify the user's current outcome, readiness, and risk, then choose the smallest sufficient path. When direct action is obvious, proceed without narrating the routing decision. When routing itself is the requested deliverable, the choice is non-obvious, or risk changes the path, state a concise recommendation and reason.
2. Consider direct execution, one focused skill, a small combination of complementary skills, or another capability exposed by the active harness. Prefer one focused skill when it is sufficient, but do not force work through this repository's taxonomy.
3. If the user wants to learn a concrete code change well enough to participate later, consider `understand-change`. If the task is to judge a change, use the narrowest review capability that covers the requested lens or `review-code` for a full diff review.
4. Check repo-local context, lessons, glossary, ADRs, or similar stores only when routing materially depends on local decisions or conventions. When the task already provides sufficient bounded evidence and a verification path, use them directly instead of rediscovering the same facts.
5. Scale depth to risk. Low-risk, solo, reversible work may proceed directly. Cross-functional, irreversible, sensitive-data, migration, security, or compliance work may benefit from earlier scoping, evidence, explicit decisions, or specialized review.
6. Human owns policy and irreversible decisions; the agent owns routing facts, gaps, and assumptions. If readiness is sufficient and assumptions are low-risk, continue without manufacturing a handoff.
7. Use the daily flow as a map, not a pipeline: scope -> options -> research or prototype -> spec -> tickets -> implementation -> optional change understanding -> review -> compound learning. Enter, skip, combine, reorder, or leave phases when the task and available capabilities justify it.
8. Apply a fidelity check before escalating the work product. Stay with discussion, scoping, options, or a spec when words and existing evidence suffice; use a prototype when the decision depends on seeing, feeling, exercising, or measuring an artifact. Do not increase fidelity merely because code is cheap or a named phase exists.
9. Make routing visible only when it helps the user evaluate a non-obvious choice. Stop at a handoff only when the user asked for routing alone or a missing user-owned decision or authority blocks safe continuation.

## Output

For obvious direct work, return the normal downstream work product without a routing wrapper.

When the path is non-obvious and continuation is requested, briefly name the recommendation and reason, then return the completed next action.

When the user explicitly asks only for routing, return:

- Recommendation: direct action or capability path.
- Reason: one sentence.
- Assumptions: only assumptions material to the route.
- Handoff: the immediate next action.

Example routing-only response:

```text
Recommendation: implement-change, then a focused review-code pass.
Reason: the behavior is settled and low risk; implementation is ready, while the
permission boundary still deserves independent verification before release.
Handoff: implement the smallest slice and review the changed permission path.
```

## Readiness Signals

- Scope helps when the problem, stakeholders, success signal, constraints, or risk could change the next move.
- Options help when the decision frame is known and the user needs a choice among real paths.
- Research helps when current external facts remain decision-critical.
- A prototype helps when an observable artifact would resolve uncertainty better than more prose.
- A spec helps when a direction is chosen and behavior, contracts, rollout, and validation need durable definition.
- Tickets help when a stable plan benefits from release sequencing, blockers, or independent slices.
- Implementation is ready when desired behavior, ownership boundaries, safety concerns, and a verification path are understood well enough to act.
- Review is ready when there is a diff, design, artifact, or release surface to inspect.
- Compound learning is useful when completed work produced a validated, reusable lesson.

These are advisory signals. Only user authority, safety, privacy, destructive impact, or another real blocking dependency should act as a hard gate.
