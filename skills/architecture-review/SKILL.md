---
name: architecture-review
description: Reviews designs, docs, code, dependencies, data models, scaling paths, reliability, complexity, and maintenance risk. Use when evaluating architecture, major refactors, platform choices, migration plans, service boundaries, data flow, or operational risk. For reviewing a concrete code diff across all lenses, use executive-code-review instead.
---

# Architecture Review

## Workflow

1. Start read-only. Inspect the request, architecture docs, relevant code, dependencies, data model, CI/deploy clues, and local instructions.
2. Map current architecture before judging it: modules, boundaries, data flow, runtime paths, integrations, trust boundaries, and ownership. Start from entry points, dependency manifests, schema or migration directories, and deploy/CI configuration, and trace at least one primary runtime path end to end.
3. Evaluate fitness against product goals, expected scale, failure modes, operational burden, security/privacy, cost, and team capacity.
4. Distinguish current-state issues from future optional improvements. Prefer fewer, higher-leverage recommendations.
5. If useful for stakeholders, draw Mermaid diagrams for current/proposed architecture, data flow, sequence, boundaries, risk hotspots, and migration phases. Produce an HTML report file only when the user asks for one, and note that Mermaid blocks need a renderer to display.
6. Recommend migration in reversible phases with validation checkpoints and rollback paths.

## Output

Return:

- Executive summary: decision, confidence, and top risks.
- Current architecture: concise map of what exists.
- Findings: severity, evidence, impact, and recommendation.
- Proposed direction: target shape and why it fits.
- Migration plan: phases, compatibility, rollout, verification, and rollback.
- Diagrams: Mermaid blocks inline, or an HTML report file when requested.
- Open questions: only items that change the decision.

Example finding:

```text
[P2] Order service reads the payments database directly, bypassing the payments
API; schema changes now require lockstep deploys. Recommend: move the two queries
behind the existing payments client and drop the cross-service DB grant.
```

## Checklist

- Boundaries, data flow, dependencies, trust boundaries, and ownership are mapped.
- Product value, reliability, security/privacy, cost, operations, and team capacity are evaluated.
- Findings distinguish current defects from future optional improvements.
- Migration phases preserve compatibility where needed.
- Rollback, monitoring, and validation checkpoints are explicit.
