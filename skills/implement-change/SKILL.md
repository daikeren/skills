---
name: implement-change
description: Use when implementing a feature, bug fix, refactor, migration, or integration in retained production code. Includes focused tests and disposable verification probes for that change.
---

# Implement Change

## Workflow

Read applicable repository instructions and inspect current changes before editing. Use a complete supplied snapshot directly; explore only the code, tooling, tests, and prior decisions needed for the requested behavior. Infer commands from repository evidence instead of assuming a framework, host, or package manager.

Define completion from the requested outcome, affected contracts, and meaningful verification. Reuse settled local patterns. Resolve missing runtime order, ownership, or verification seams only when they could materially change the implementation; surface contradictions rather than redesigning inside an unrelated diff.

Keep the retained change small and reversible. Reuse existing helpers, components, settings, feature flags, and test styles. Protect unexpected user-authored changes. Update affected schemas, APIs, service logic, client types, UI states, docs/i18n, and tests together when behavior crosses layers.

Use precise contracts and the shortest locally idiomatic names that search uniquely. Keep non-obvious constraints beside their definitions. Do not rename stable interfaces or broaden the diff solely for agent discoverability.

Read supporting guidance only when its condition applies:

- [stateful-changes.md](references/stateful-changes.md): correctness depends on state precedence, event order, multiple async owners or identity paths, or a fallback that can authorize, charge, clear, delete, or publish. If a fix-review loop finds a second violation of the same invariant, reassess that invariant and its sibling paths before another patch.
- [verification-probes.md](references/verification-probes.md): existing checks cannot settle a material claim and an isolated disposable probe may supply better evidence. This can support frontend, backend, data, integration, or operational work; skip it when focused verification already answers the question.
- [scope-fit.md](references/scope-fit.md): the diff is broader than the requested outcome or mixes independent changes. Remove incidental edits made during this task, while preserving user work.

Continue within existing authorization through implementation, relevant verification, and fixes for failures caused by the change. Rerun affected checks after a fix; stop expanding verification once the material claims are settled. Review the final diff for scope, permissions, sensitive data, migrations, and contract gaps before reporting completion. Do not stop merely because a first implementation exists.

Keep product, policy, rollout, and irreversible commitments within the user's delegated authority. State material low-risk assumptions and continue authorized work; pause only the dependent action when a consequential decision or permission is missing. Being unattended does not grant extra authority. Record blocked verification or external dependencies without claiming completion of the affected outcome.

## Output

Report the changed behavior and files, the exact meaningful verification command or manual check and result, and material residual risk. Include failure output, surprising results, scope dispositions, or rollout notes only when they help assess the change. A small task needs a compact completion report, not repeated process headings.
