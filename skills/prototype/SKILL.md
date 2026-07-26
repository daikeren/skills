---
name: prototype
description: Runs disposable prototype exploration to learn product feel, technical feasibility, workflow, data shape, or integration risk before committing to production code, and disposable verification when the probe itself is the requested work product. Use when a throw-away proof of concept, spike, mock, harness, or experiment would reduce uncertainty faster than planning or prolonged inspection. Use implement-change instead when the requested outcome includes changing retained production code, even if a disposable probe is also needed.
---

# Prototype

## Workflow

1. State the prototype question and the learning target. Keep it separate from production implementation.
2. Apply the fidelity gate: use the lowest fidelity that can answer the question honestly. Lowest sufficient fidelity means the artifact still has enough discriminating power to resolve the stated uncertainty; it does not mean the smallest artifact regardless of what it can teach. Stay with discussion, scoping, or a spec when words and existing evidence are enough; prototype when the uncertainty depends on seeing, feeling, exercising, or measuring an artifact, such as interaction behavior, a state model, data shape, or integration feasibility. Do not prototype merely because code is cheap or the work is large.
3. Start read-only and inspect only enough context to avoid duplicating existing work or damaging user changes. When the task supplies a complete bounded fixture, existing harness, and learning question, use them directly and skip unrelated repository discovery.
4. Check repo-local context, lessons, glossary, ADRs, or similar stores only when a previous experiment or decision could materially answer the question.
5. Scale depth to risk. Low-risk, solo, reversible uncertainty can use a quick scratch artifact; sensitive-data, migration, security, compliance, or irreversible uncertainty should use mocks, fixtures, or stop for a decision before touching real systems.
6. Choose the least intrusive proving ground: direct or stdin execution, an existing fixture or harness, a temporary file, scratch script, isolated branch, local mock, or minimal route. For a self-contained code fixture, prefer a single direct or in-memory invocation when the platform supports it; do not search the repository, persist a copy, or create a reported artifact when that adds no evidence. Use repo tooling only when the task depends on it.
7. Build the smallest sufficient artifact only when an artifact is still needed. When a supplied fixture or existing harness already permits the decisive observation, exercise it directly; do not rebuild, copy, wrap, or retain it merely to demonstrate prototyping. Prefer fake data, local fixtures, and reversible changes unless real integration is the point. For a comparison, first satisfy any supplied alternatives, shared data, tasks, and observation protocol instead of redesigning the experiment. Make alternatives meaningfully exercisable and automate cheap objective signals that reduce observer error, such as correctness, completion, actions, or per-run timing, before adding qualitative notes, export, randomization, tracing, or polish. Add a control only for a named confound and stop once the artifact can answer the question honestly. Artifact size is not the goal or the decision rule: a larger generated harness is justified only when isolation keeps its risk low and it produces materially stronger evidence at lower total cost.
8. Use disposable verification mode when production work already exists or is underway and a material claim is cheaper to challenge with isolated code than prolonged inspection. This extends rather than replaces pre-implementation exploration. When the primary outcome still includes changing production code, `implement-change` remains the owning workflow and may use this mode as a subordinate probe. Applicable probes include UI interaction harnesses, request replays, differential or adversarial input generators, load or concurrency probes, migration dry runs, custom traces or debuggers, and temporary lint or contract checks across frontend, backend, data, integration, and operational paths.
9. Keep verification probes separate from the retained production diff when practical. Do not let generated probes weaken required human review, release gates, or durable regression coverage. Generated implementation and generated verification can share the same mistaken assumption, so consequential claims need an independent oracle, invariant, known-good result, or separately derived comparison.
10. Human owns product and rollout decisions; agent owns observations. If the user is absent, continue only under harmless recorded assumptions and stop before production commitments.
11. Verify the prototype with one concrete observation: output, screenshot, trace, command result, API response, or user-flow check. Distinguish build evidence from decision evidence: syntax checks can show that an artifact runs, but not which interaction feels better; a hypothetical or paper walkthrough is design reasoning, not observed interaction. When representative use is still needed, deliver a ready-to-run comparison and label the product decision inconclusive.
12. Stop before hardening, broad refactors, styling polish, executing production migrations, or production rollout unless the user explicitly asks to continue.
13. Remove or clearly quarantine disposable artifacts when they should not remain in the repo.

## Output

For a bounded observation, return the observed evidence, what it establishes, and any material unresolved risk or next step directly. Do not add a disposable artifact, five-part handoff, or repeated labels when a compact answer carries the same decision value.

For a substantial exploratory artifact or experiment, return the useful subset of:

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
