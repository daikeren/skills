---
name: strategy-to-options
description: Turns a framed strategic or technical decision with sufficient supporting evidence into 2-4 decision-ready options with tradeoffs and bounded pressure-testing. Use when the primary deliverable is a choice about what to do, which path to take, whether to build, buy, or defer, or how to balance speed, risk, cost, reversibility, product impact, and team constraints. Use scope-work first when goals or constraints are unframed, and research-brief first when current external facts remain decision-critical and unverified.
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
9. Human owns the choice; agent owns the facts, tradeoffs, recommendation, and uncertainty. Present options and stop for user choice before spec, tickets, or implementation.
10. If unattended/headless and a downstream workflow requires a choice, select the recommended option only as an explicit assumption, record why, and name what evidence should revisit it.
11. Recommend the smallest decisive next step without executing it: experiment, prototype, spec, implementation slice, vendor check, or stakeholder decision.
12. If a domain term or decision crystallizes, suggest optional glossary or ADR capture only when it will help future work; do not force docs into every decision.

## Output

Return:

- Decision: what choice is being made and by when.
- Options: 2-4 options with what changes, why it works, tradeoffs, cost, risk, reversibility, and speed.
- Pressure test: assumptions, edge cases, and contradictions that could change the recommendation.
- Recommendation: preferred option and confidence.
- Choose this when: a short rule for selecting each option.
- Decision point: the user choice needed, or the unattended assumption used.
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
- The output stops after options unless the user has already chosen or an unattended assumption is explicitly recorded.
