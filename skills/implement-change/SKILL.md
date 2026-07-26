---
name: implement-change
description: Guides coding work to stay small, reversible, idiomatic, and verified while protecting user changes. Use when implementing a feature, bug fix, refactor, migration, or cross-stack change where the agent must detect local tooling, preserve diffs, update contracts, and verify the smallest meaningful surface; this remains the owning workflow when isolated disposable frontend, backend, data, integration, or operational probes such as request replays, migration dry runs, contract checks, load or concurrency probes, and custom traces are needed to verify the retained production change.
---

# Implement Change

## Workflow

1. Start read-only. Check the task workspace and only the context needed to change it safely. When the task supplies a complete bounded repository snapshot or diff, use it directly; do not inspect unrelated package surfaces or repeat discovery already answered by the fixture.
2. Check repo-local context, lessons, glossary, ADRs, or similar stores when prior decisions could affect implementation.
3. Detect tooling from repo evidence: package files, lockfiles, Makefiles, CI, docs, scripts, and local commands. Do not assume a framework, package manager, or host.
4. Scale depth to risk. Low-risk, solo, reversible work can use a lightweight path; cross-functional, irreversible, sensitive-data, migration, security, or compliance work needs a standard or deeper plan, rollout, and verification.
5. Before editing, confirm any program shape from the plan or tickets against current code. If unresolved runtime order, ownership, key contracts, or verification seams could materially affect the slice, reuse a settled local pattern or resolve only the missing decisions. Surface contradictions instead of redesigning inside the diff; skip routine work.
6. Run the stateful-change checkpoint before editing when correctness depends on cross-state precedence, temporal ordering, multiple async owners or data sources, several identity paths or representations, or a fallback that can authorize, clear, charge, delete, publish, or make another consequential decision. Keep the checkpoint compact; do not force it onto routine changes whose local loading, error, and success states already follow an established pattern.
7. If a fix-review loop produces a second confirmed issue from the same state, identity, ordering, or fallback invariant, stop applying isolated patches. Reconstruct the invariant surface, event timeline, and sibling paths before choosing the next fix.
8. Keep the slice small and reversible. Reuse existing helpers, services, hooks, feature flags, settings, components, and test styles.
9. Make changed code easy to retrieve and understand with repository search. Prefer the shortest locally idiomatic names that search uniquely, adding domain terms to symbols, files, and paths only as needed; use one spelling per concept; make contracts and types precise enough to use without opening implementations; and place explanations of non-obvious constraints beside the definitions readers will find. Do not broaden the change or rename stable interfaces solely for agent discoverability.
10. Protect user work. Treat unexpected diffs as user-authored and work around them unless the user asks otherwise.
11. Human owns product, policy, rollout, and irreversible decisions; agent owns implementation facts, diffs, and evidence. If the user is absent, proceed only with explicitly recorded low-risk assumptions.
12. Update contracts end to end when behavior crosses layers: schemas, APIs, service logic, hooks/types, UI states, docs, and tests.
13. Run the evidence-amplification checkpoint when a material implementation claim remains poorly observable with existing checks.
14. Verify the riskiest behavior with the smallest meaningful command or manual check. Record the exact command or manual check invocation and the result summary; include relevant output on failure or surprising pass. If verification cannot run, explain the blocker.
15. Before finalizing, run the scope-fit checkpoint, then review the retained diff for missing tests, migration hazards, permissions, data exposure, and docs/i18n gaps.

## Stateful-Change Checkpoint

Before implementation, name only the dimensions that can change correctness:

- State axes and precedence, especially loading, unavailable, error, empty, success, historical, and active states.
- The canonical source of truth and identity or episode boundary. Do not rely on several partial identifiers when one authoritative relation can be recorded.
- Event order and ownership across requests, retries, persistence steps, queues, callbacks, or workspace/account switches.
- Fallback semantics. State which fallbacks are display-only and which may authorize, clear, charge, delete, publish, or otherwise make a consequential decision; consequential uncertainty should normally fail closed.
- A compact adversarial matrix covering prior episodes, stale responses, partial or legacy data, alternate matching paths, equal timestamps, and permission variants that are reachable for this change.

Turn the important invariants into table-driven, transition, timeline, or race regression coverage before or alongside the implementation. Prefer a first-class identity or state transition over increasingly broad inference and fallback logic.

## Evidence-Amplification Checkpoint

When existing tests, tools, or inspection cannot settle a material implementation claim, consider a disposable verification probe before expanding or hardening the production change:

1. State the claim or invariant to challenge and the concrete observation that would falsify it.
2. Choose an isolated probe suited to the path: UI interaction harness, request replay, differential or adversarial input generator, load or concurrency probe, migration dry run, custom trace or debugger, or temporary lint or contract check. Apply this across frontend, backend, data, integration, and operational code rather than treating it as a UI-only technique.
3. Keep the retained production diff small and keep the probe separate when practical. Generate the probe because it improves evidence, not merely because code is cheap.
4. For consequential claims, compare against an independent oracle, invariant, known-good result, or separately derived implementation. Generated production code and generated verification may share the same failure mode.
5. Record the result, then discard or quarantine the probe by default. Promote it into durable tests or tooling only when ongoing value, reviewability, and maintenance cost justify retention.

Disposable verification supplements required human review, release gates, and durable regression coverage; it does not replace them. Skip this checkpoint when existing focused verification already answers the material question.

## Scope-Fit Checkpoint

Before finalizing a change whose diff is broader than the stated outcome:

1. Restate the intended outcome in one line, then map each changed file or coherent hunk to that outcome.
2. Treat dependency additions, public contract renames, config, CI or build edits, formatting-only churn, generated or lockfile noise, cross-subsystem spread, and oversized mixed hunks as review prompts, not proof of scope creep.
3. Give each questionable item one disposition: **keep** when it is directly necessary; **split** when it is independently valuable or unrelated; **justify** when a cross-cutting invariant or build constraint makes separation unsafe.
4. Inspect the actual change and its callers, tests, contracts, and generated relationships. Do not infer scope fit from path keywords, directory count, or diff size alone.
5. Remove incidental edits created during the task. Ask before reverting, unstaging, relocating, or otherwise altering user-authored work.

Keep this checkpoint lightweight for a small coherent diff. Report the dispositions only when the scope is genuinely mixed, a surprising surface remains, or a follow-up split is useful.

## Output

During work, report only meaningful progress. For a tiny bounded change, return the changed behavior, focused verification, and any material residual risk directly without repeating the same fact under several headings. For a broader change, include the useful subset of:

- Changed files and why.
- Verification evidence: exact command or manual check invoked, result summary, and relevant output for failures or surprising passes.
- User-facing behavior changed.
- Scope disposition when relevant: surprising changes kept, split, or justified.
- Residual risk, rollout gaps, or tests not run.

Example completion report:

```text
Changed: orders/service.py (idempotency key on retry) and its test file.
Verified: `pytest tests/test_orders.py` -> 14 passed.
User-facing: duplicate order submissions now return the original order.
Residual risk: no load test on the new unique index.
```

## Checklist

- Local instructions and repository state were checked before editing.
- Tooling was detected from repository evidence.
- Existing helpers, services, patterns, settings, flags, and tests were reused where practical.
- Changed code uses the shortest locally idiomatic names that search uniquely, precise contracts, and definition-adjacent explanations without unnecessary renames or scope expansion.
- Stateful or integration-heavy changes named state precedence, canonical identity, event order, and fallback semantics before editing.
- A second same-family finding triggered an invariant-level reassessment instead of another isolated patch.
- Material claims that existing checks could not settle used an isolated evidence-amplification probe or recorded why one was unnecessary.
- Cross-layer contracts were updated together.
- Broad or mixed diffs were checked against the one-line outcome with keep, split, or justify dispositions based on semantic evidence.
- Completion includes verification evidence, not just a claim that checks passed.
