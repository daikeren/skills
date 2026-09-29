# Scope-Fit Checkpoint

Before finalizing a change whose diff is broader than the stated outcome:

1. Restate the intended outcome in one line, then map each changed file or coherent hunk to that outcome.
2. Treat dependency additions, public contract renames, config, CI or build edits, formatting-only churn, generated or lockfile noise, cross-subsystem spread, and oversized mixed hunks as review prompts, not proof of scope creep.
3. Give each questionable item one disposition: **keep** when it is directly necessary; **split** when it is independently valuable or unrelated; **justify** when a cross-cutting invariant or build constraint makes separation unsafe.
4. Inspect the actual change and its callers, tests, contracts, and generated relationships. Do not infer scope fit from path keywords, directory count, or diff size alone.
5. Remove incidental edits created during the task. Ask before reverting, unstaging, relocating, or otherwise altering user-authored work.

Keep this checkpoint lightweight for a small coherent diff. Report the dispositions only when the scope is genuinely mixed, a surprising surface remains, or a follow-up split is useful.
