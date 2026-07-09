---
name: strategy-to-options
description: Turns an ambiguous strategic or technical direction into 2-4 decision-ready options with tradeoffs and bounded pressure-testing. Use when the user asks what to do, which path to choose, whether to build or buy, how to sequence a major change, or how to balance speed, risk, cost, reversibility, product impact, and team constraints. Use cto-intake first when goals, stakeholders, or constraints are still unframed.
---

# Strategy To Options

## Workflow

1. Start from the decision, not the first proposed solution. Identify the user outcome, business goal, technical context, constraints, and decision horizon.
2. Gather enough evidence to avoid option theater. If facts are current or external, use `research-brief` or browse before recommending.
3. Run a bounded grilling pass before locking options: challenge fuzzy terms, probe concrete edge cases, check whether code or docs contradict the story, and identify assumptions that would flip the recommendation.
4. Generate 2-4 real options. Include the conservative default, a faster path, a more durable path, and a no-build or defer option when plausible.
5. Score each option on user impact, architecture fit, security/privacy, operational burden, cost, team speed, reversibility, and time to learn.
6. Name the condition under which each option is the right choice. Avoid pretending one path is universally best.
7. Recommend the smallest decisive next step: experiment, prototype, spec, implementation slice, vendor check, or stakeholder decision.
8. If a domain term or decision crystallizes, suggest optional glossary or ADR capture only when it will help future work; do not force docs into every decision.

## Output

Return:

- Decision: what choice is being made and by when.
- Options: 2-4 options with what changes, why it works, tradeoffs, cost, risk, reversibility, and speed.
- Pressure test: assumptions, edge cases, and contradictions that could change the recommendation.
- Recommendation: preferred option and confidence.
- Choose this when: a short rule for selecting each option.
- Next step: the smallest action that reduces uncertainty or moves delivery forward.

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
- The next step reduces uncertainty without overcommitting.
