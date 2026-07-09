---
name: prototype
description: Runs disposable prototype exploration to learn product feel, technical feasibility, workflow, data shape, or integration risk before committing to production code. Use when a throw-away proof of concept, spike, mock, harness, or experiment would reduce uncertainty faster than planning or implementation.
---

# Prototype

## Workflow

1. State the prototype question and the learning target. Keep it separate from production implementation.
2. Start read-only and inspect the repo enough to avoid duplicating existing work or damaging user changes.
3. Choose the least intrusive proving ground: a temporary file, scratch script, isolated branch, local mock, fixture, or minimal route. Use the repo's existing tooling only after detecting it.
4. Build the smallest artifact that can answer the question. Prefer fake data, local fixtures, and reversible changes unless real integration is the point.
5. Verify the prototype with one concrete observation: output, screenshot, trace, command result, API response, or user-flow check.
6. Stop before hardening, broad refactors, styling polish, migration work, or production rollout unless the user explicitly asks to continue.
7. Remove or clearly quarantine disposable artifacts when they should not remain in the repo.

## Output

End with:

- Learned: what the prototype proved, disproved, or made visible.
- Discard: code, assumptions, approaches, or dependencies that should not move forward.
- Follow-up: the smallest production-quality next step, including risks and verification needed.

When the prototype leaves files behind, label them as disposable or explain why they should become part of the next implementation slice.

Example ending:

```text
Learned: the vendor SDK cannot stream partial results; the UI must poll.
Discard: the streaming wrapper spike and its mock server.
Follow-up: spec a polling endpoint with backoff; verify vendor rate limits first.
```
