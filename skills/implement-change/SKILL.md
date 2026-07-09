---
name: implement-change
description: Guides coding work to stay small, reversible, idiomatic, and verified while protecting user changes. Use when implementing a feature, bug fix, refactor, migration, or cross-stack change where the agent must detect local tooling, preserve diffs, update contracts, and verify the smallest meaningful surface.
---

# Implement Change

## Workflow

1. Start read-only. Check location, repo state, local instructions, relevant files, tests, docs, and existing patterns before editing.
2. Check repo-local context, lessons, glossary, ADRs, or similar stores when prior decisions could affect implementation.
3. Detect tooling from repo evidence: package files, lockfiles, Makefiles, CI, docs, scripts, and local commands. Do not assume a framework, package manager, or host.
4. Scale depth to risk. Low-risk, solo, reversible work can use a lightweight path; cross-functional, irreversible, sensitive-data, migration, security, or compliance work needs a standard or deeper plan, rollout, and verification.
5. Keep the slice small and reversible. Reuse existing helpers, services, hooks, feature flags, settings, components, and test styles.
6. Protect user work. Treat unexpected diffs as user-authored and work around them unless the user asks otherwise.
7. Human owns product, policy, rollout, and irreversible decisions; agent owns implementation facts, diffs, and evidence. If the user is absent, proceed only with explicitly recorded low-risk assumptions.
8. Update contracts end to end when behavior crosses layers: schemas, APIs, service logic, hooks/types, UI states, docs, and tests.
9. Verify the riskiest behavior with the smallest meaningful command or manual check. Record the exact command or manual check invocation and the result summary; include relevant output on failure or surprising pass. If verification cannot run, explain the blocker.
10. Before finalizing, review your own diff for accidental scope creep, missing tests, migration hazards, permissions, data exposure, and docs/i18n gaps.

## Output

During work, report only meaningful progress. At completion, include:

- Changed files and why.
- Verification evidence: exact command or manual check invoked, result summary, and relevant output for failures or surprising passes.
- User-facing behavior changed.
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
- Cross-layer contracts were updated together.
- Completion includes verification evidence, not just a claim that checks passed.
