---
name: strategy-to-options
description: Use when comparing build, buy, defer, or other concrete options for a framed decision with sufficient evidence. Weigh cost, risk, and reversibility; honor delegated choices.
---

# Strategy To Options

## Workflow

1. Start from the decision, not the first proposed solution. Identify the user outcome, business goal, technical context, constraints, and decision horizon.
2. Check repo-local context, lessons, glossary, ADRs, or similar stores when previous decisions or vocabulary affect the options.
3. Confirm the evidence is sufficient to compare real paths. If current external facts remain decision-critical and unverified, use `research-brief` before generating options rather than inventing assumptions.
4. Scale depth to risk. Low-risk, solo, reversible decisions can use a short comparison; cross-functional, irreversible, sensitive-data, migration, security, or compliance decisions need deeper evidence and explicit decision criteria.
5. Run a bounded grilling pass before locking options: challenge fuzzy terms, probe concrete edge cases, check whether code or docs contradict the story, and identify assumptions that would flip the recommendation.
6. Generate 2-4 real options. Include the conservative default, a faster path, a more durable path, and a no-build or defer option when plausible.
7. Score each option on user impact, architecture fit, security/privacy, operational burden, cost, team speed, reversibility, and time to learn.
8. Name the condition under which each option is the right choice. Avoid pretending one path is universally best.
9. Respect the task's decision authority. For an options-only request, present the comparison and recommendation. If the user has delegated the choice and downstream work, choose within those bounds, explain the decision briefly, and continue to the requested outcome. Stop only for a material decision or action outside existing authorization.
10. Being unattended does not grant decision authority. Within delegated bounds, record material low-risk assumptions and what would change the choice; leave unauthorized consequential commitments pending while completing independent work.
11. Complete the authorized next step when continuation is part of the request. Otherwise name the smallest useful next action without executing it.
12. If a domain term or decision crystallizes, suggest optional glossary or ADR capture only when it will help future work; do not force docs into every decision.

## Output

For an options-only request, return the useful subset of:

- Decision: what choice is being made and by when.
- Options: 2-4 options with what changes, why it works, tradeoffs, cost, risk, reversibility, and speed.
- Pressure test: assumptions, edge cases, and contradictions that could change the recommendation.
- Recommendation: preferred option and confidence.
- Choose this when: a short rule for selecting each option.
- Decision point: the user choice needed, or the unattended assumption used.
- Next step: the smallest action that reduces uncertainty or moves delivery forward.

When continuation is authorized, keep the comparison proportionate and return the completed downstream work with its verification and any material remaining decision.

Example option:

```text
Option B - adopt vendor metering. Fastest path to invoice-accurate usage; adds
per-event cost and export lock-in; reversible within a quarter via our own event
log. Choose this when billing accuracy matters more than unit cost this year.
```

## Checklist

- Outcome, horizon, reversibility, evidence, and stakeholders are explicit.
- Options cover product value, architecture fit, security/privacy, operations, cost, team speed, and time to learn.
- No-build, defer, or vendor paths are included when plausible.
- The recommendation names when it should be revisited.
- Options-only requests stop at a recommendation; delegated choices continue through the authorized outcome. Unattended execution does not expand permission.
