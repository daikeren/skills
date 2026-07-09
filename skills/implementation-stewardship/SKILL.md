---
name: implementation-stewardship
description: Guides coding work to stay small, reversible, idiomatic, and verified while protecting user changes. Use when implementing a feature, bug fix, refactor, migration, or cross-stack change where the agent must detect local tooling, preserve diffs, update contracts, and verify the smallest meaningful surface.
---

# Implementation Stewardship

## Workflow

1. Start read-only. Check location, repo state, local instructions, relevant files, tests, docs, and existing patterns before editing.
2. Detect tooling from repo evidence: package files, lockfiles, Makefiles, CI, docs, scripts, and local commands. Do not assume a framework, package manager, or host.
3. Keep the slice small and reversible. Reuse existing helpers, services, hooks, feature flags, settings, components, and test styles.
4. Protect user work. Treat unexpected diffs as user-authored and work around them unless the user asks otherwise.
5. Update contracts end to end when behavior crosses layers: schemas, APIs, service logic, hooks/types, UI states, docs, and tests.
6. Verify the riskiest behavior with the smallest meaningful command or manual check. If verification cannot run, explain the blocker.
7. Before finalizing, review your own diff for accidental scope creep, missing tests, migration hazards, permissions, data exposure, and docs/i18n gaps.

## Output

During work, report only meaningful progress. At completion, include:

- Changed files and why.
- Verification run and result.
- User-facing behavior changed.
- Residual risk, rollout gaps, or tests not run.

Example completion report:

```text
Changed: orders/service.py (idempotency key on retry) and its test file.
Verified: ran the order-service test suite - 14 passed.
User-facing: duplicate order submissions now return the original order.
Residual risk: no load test on the new unique index.
```

## Checklist

- Local instructions and repository state were checked before editing.
- Tooling was detected from repository evidence.
- Existing helpers, services, patterns, settings, flags, and tests were reused where practical.
- Cross-layer contracts were updated together.
- Verification targets the riskiest behavior and any gaps are explained.
