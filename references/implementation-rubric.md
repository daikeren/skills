# Implementation Rubric

Use this rubric for coding work that should stay small, reversible, idiomatic, and verified.

## Before Editing

- Read local instructions and relevant docs.
- Check current repository state and preserve existing user changes.
- Identify the smallest behavior change that solves the task.
- Detect tooling from project files, CI, scripts, and docs.
- Find existing helpers, services, patterns, settings, flags, and tests.

## During Implementation

- Keep changes close to the touched behavior and ownership boundary.
- Reuse existing contracts before adding new abstractions.
- Update all affected layers when behavior crosses boundaries.
- Keep migrations, compatibility layers, and cleanup sequenced safely.
- Do not mix unrelated cleanup with feature or bug work.
- Make failure modes explicit at trust boundaries and external integrations.

## Verification

- Run the smallest command that proves the risky behavior.
- Add or update tests when behavior is non-trivial or shared.
- Include manual verification when UI, CLI, generated artifacts, or operational behavior matters.
- Document verification gaps when tools, secrets, services, or time prevent a full run.

## Completion

- Review the diff for scope creep, missing permission checks, sensitive data exposure, and stale docs.
- Summarize changed files, behavior, verification, and residual risk.
- Leave rollout notes for flags, migrations, monitoring, or support handoffs.
