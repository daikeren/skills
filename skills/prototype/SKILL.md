---
name: prototype
description: Runs disposable prototype exploration to learn product feel, technical feasibility, workflow, data shape, or integration risk before committing to production code. Use when a throw-away proof of concept, spike, mock, harness, or experiment would reduce uncertainty faster than planning or implementation.
---

# Prototype

## Workflow

1. State the prototype question and the learning target. Keep it separate from production implementation.
2. Apply the fidelity gate: use the lowest fidelity that can answer the question honestly. Stay with discussion, scoping, or a spec when words and existing evidence are enough; prototype when the uncertainty depends on seeing, feeling, exercising, or measuring an artifact, such as interaction behavior, a state model, data shape, or integration feasibility. Do not prototype merely because code is cheap or the work is large.
3. Start read-only and inspect the repo enough to avoid duplicating existing work or damaging user changes.
4. Check repo-local context, lessons, glossary, ADRs, or similar stores when a previous experiment or decision could answer the question.
5. Scale depth to risk. Low-risk, solo, reversible uncertainty can use a quick scratch artifact; sensitive-data, migration, security, compliance, or irreversible uncertainty should use mocks, fixtures, or stop for a decision before touching real systems.
6. Choose the least intrusive proving ground: a temporary file, scratch script, isolated branch, local mock, fixture, or minimal route. Use the repo's existing tooling only after detecting it.
7. Build the smallest artifact that can answer the question. Prefer fake data, local fixtures, and reversible changes unless real integration is the point.
8. Human owns product and rollout decisions; agent owns observations. If the user is absent, continue only under harmless recorded assumptions and stop before production commitments.
9. Verify the prototype with one concrete observation: output, screenshot, trace, command result, API response, or user-flow check.
10. Stop before hardening, broad refactors, styling polish, migration work, or production rollout unless the user explicitly asks to continue.
11. Remove or clearly quarantine disposable artifacts when they should not remain in the repo.

## Output

End with:

- Evidence/Observation: the exact output, screenshot, trace, command result, API response, or user-flow check that supports the learning.
- Learned: what the prototype proved, disproved, or made visible.
- Discard: code, assumptions, approaches, or dependencies that should not move forward.
- Decision point: user choice needed next, or harmless assumption used while unattended.
- Follow-up: the smallest production-quality next step, including risks and verification needed.

Tie every claim in Learned to the Evidence/Observation. If no concrete observation was produced, say that the prototype is inconclusive rather than claiming it proved or disproved anything.

When the prototype leaves files behind, label them as disposable or explain why they should become part of the next implementation slice.

Example ending:

```text
Evidence/Observation: `node spike.js` returned only a final response after 4.2s; no partial callbacks fired.
Learned: the vendor SDK cannot stream partial results; the UI must poll.
Discard: the streaming wrapper spike and its mock server.
Follow-up: spec a polling endpoint with backoff; verify vendor rate limits first.
```
