---
name: architecture-review
description: Reviews designs, docs, code, dependencies, data models, scaling paths, reliability, complexity, and maintenance risk. Use when evaluating architecture, major refactors, platform choices, migration plans, service boundaries, data flow, or operational risk. For reviewing a concrete code diff across all lenses, use review-code instead.
---

# Architecture Review

## Workflow

1. Start read-only. Inspect the request, architecture docs, relevant code, dependencies, data model, CI/deploy clues, and local instructions.
2. Stay report-only. Inspect and report findings or recommendations; do not edit code, docs, diagrams, or configuration unless the user explicitly changes the task from review to fix.
3. Map current architecture before judging it: modules, boundaries, data flow, runtime paths, integrations, trust boundaries, and ownership. Start from entry points, dependency manifests, schema or migration directories, and deploy/CI configuration, and trace at least one primary runtime path end to end.
4. Evaluate fitness against product goals, expected scale, failure modes, operational burden, security/privacy, cost, and team capacity.
5. Distinguish current defects or regressions from optional future improvements and missing validation. Prefer fewer, higher-leverage recommendations.
6. If useful for stakeholders, draw Mermaid diagrams for current/proposed architecture, data flow, sequence, boundaries, risk hotspots, and migration phases. Produce an HTML report file only when the user asks for one, and note that Mermaid blocks need a renderer to display.
7. Recommend migration in reversible phases with validation checkpoints and rollback paths.

## Output

Return:

- Executive summary: decision, confidence, and top risks.
- Current architecture: concise map of what exists.
- Findings: severity, confidence, type, evidence, impact, and smallest credible fix direction.
- Proposed direction: target shape and why it fits.
- Migration plan: phases, compatibility, rollout, verification, and rollback.
- Diagrams: Mermaid blocks inline, or an HTML report file when requested.
- Open questions: only items that change the decision.

Use severity:

- `[P0]` release blocker, active exploit, data loss, widespread outage, or irreversible destructive behavior.
- `[P1]` likely user-facing regression, authorization/privacy break, migration hazard, or serious operational risk.
- `[P2]` moderate bug, missing guardrail, important test gap, or maintainability issue with plausible near-term cost.
- `[P3]` low-risk issue that still affects correctness, clarity, or future review.

Use confidence labels:

- High: directly observed in code, diff, design, or behavior with an unambiguous trace to impact.
- Medium: supported by concrete evidence, but one assumption remains about runtime behavior, configuration, user path, or intended policy.
- Low: plausible risk with incomplete evidence; frame as an assumption or open question and avoid P0/P1 severity.

P0/P1 findings require concrete evidence: file:line or surface reference plus a short quote or paraphrase of the offending line, state, or behavior when available. If evidence cannot be cited, lower the severity or mark it as an assumption or open question. Classify each finding as `current defect/regression`, `missing validation`, or `optional improvement`.

Example finding:

```text
[P2][Medium] services/orders.py:142 - Order service reads the payments database directly.
Type: current defect/regression. Evidence: query uses `payments_db.session`
instead of the payments client. Impact: schema changes require lockstep deploys.
Fix: move the queries behind the existing payments client and remove the DB grant.
```

## Checklist

- Boundaries, data flow, dependencies, trust boundaries, and ownership are mapped.
- Product value, reliability, security/privacy, cost, operations, and team capacity are evaluated.
- Findings distinguish current defects from future optional improvements.
- Migration phases preserve compatibility where needed.
- Rollback, monitoring, and validation checkpoints are explicit.
