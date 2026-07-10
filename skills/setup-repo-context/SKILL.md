---
name: setup-repo-context
description: Detects, creates, and maintains lightweight repository context for agents. Use when onboarding an agent to a repository, setting up or refreshing repo-specific working instructions, finding local conventions for specs, tickets, reviews, verification, lessons, decisions, or AFK handoff, or reconciling stale agent context with current repository evidence. Default to read mode for discovery. Create or update context only when the user explicitly asks or a repo instruction explicitly requires maintenance; an existing context convention alone is not write authorization.
---

# Setup Repo Context

## Workflow

1. Start read-only. Inspect repository location, version-control state, nearest instruction files, existing agent configs, contribution docs, development docs, scripts, package metadata, CI config, issue or spec references, and any user-provided context.
2. Prefer existing convention over new structure. Use the repo's current instruction or context file when it already exists, or a documented local convention when one is clear.
3. Classify each convention as explicit, inferred, or unknown. Explicit conventions come from repo instructions, docs, config, scripts, or user direction. Inferred conventions come from repeated file names, directory patterns, command names, branches, commit messages, or examples. Unknown means no stable evidence was found.
4. Choose the mode explicitly. Read mode is the default for onboarding, discovery, and convention lookup; it returns a context snapshot without writing. Write mode requires an explicit user request or a repo instruction that explicitly requires context maintenance. An existing file or directory decides where an authorized update belongs, not whether it is authorized.
5. In write mode, use the repo's existing context target when one exists. When creating a new context after an explicit request, choose the least tool-specific location that fits visible repo conventions. If no convention exists, ask or propose a portable path such as `.agents/repo-context.md`.
6. In write mode, update stale entries only when current repo evidence contradicts recorded context. Keep the user's prose and decisions intact; update the smallest dated or evidence-backed field, and mark unresolved conflicts instead of guessing.
7. Keep the public core generic. Do not assume a repository host, issue tracker, CI system, package manager, framework, deployment model, or monorepo layout.
8. Finish with the active context sources, any file changed, and the fallback behavior future agents should use when a field is unknown.

## Context Sources

Look for these sources before writing anything:

- Agent and repo instructions: `AGENTS.md`, `CLAUDE.md`, `.agents/`, `.codex/`, `.claude/`, `.opencode/`, or equivalent local instructions.
- Development docs: `CONTRIBUTING*`, `README*`, `docs/`, `dev/`, `handbook/`, `architecture/`, `decisions/`, and release or runbook files.
- Tooling evidence: package manifests, lockfiles, Makefiles, task runners, test configs, lint configs, formatter configs, editor configs, and CI or automation config.
- Work artifacts: specs, tickets, decision records, planning docs, issue templates, PR templates, changelogs, and generated reports.
- Learning artifacts: lesson stores, workflow logs, postmortems, retrospectives, review rubrics, and local preference guidance.

## Repo Context Shape

Record only fields supported by evidence or user direction. A useful context file usually includes:

- Sources checked: file paths or commands used to establish context.
- Artifact locations: where specs, tickets, decisions, runbooks, releases, and generated outputs live.
- Review policy: severity scale, required review lenses, approval expectations, and any "no findings" convention.
- Verification commands: smallest meaningful checks, broad checks, setup prerequisites, and known slow or external checks.
- Tooling evidence: tracker, host, CI, deployment, package manager, framework, language, or monorepo signals, each labeled explicit or inferred.
- Learning store path: where reusable lessons should be read from and written to.
- Local decision conventions: ADR format, decision owners, escalation paths, rollback notes, or "ask before changing" areas.
- AFK and handoff conventions: what to leave running, how to summarize incomplete work, and where to park follow-up notes.

Use compact fields with evidence labels:

```text
Verification commands
- explicit: `npm run validate` from package.json.
- inferred: `npm test` appears in docs but no test script is defined.
- unknown: no release or deploy command found.
```

## Update Rules

- Treat existing context as user-authored. Preserve unrelated sections and comments.
- Treat an existing context target as location evidence, not write authorization.
- Prefer additive updates when evidence is incomplete. Replace only stale values that are directly contradicted by current files or commands.
- Keep inferred conventions visibly labeled so future agents can challenge them.
- Remove or mark entries stale when the backing file, command, or directory disappears.
- Do not copy secrets, private customer data, credentials, tokens, or internal-only policy into public docs.
- If the repo uses generated context, run the documented generator instead of hand-editing its output.

## Output

Return:

- Active context: the files or docs that now define repo conventions.
- Changes: created, updated, or intentionally skipped; read mode must say that writes were skipped.
- Evidence: the strongest sources for artifact locations, review policy, verification commands, tooling, lesson store, decisions, and AFK handoff.
- Unknowns: fields with no reliable evidence and the safe fallback.
- Next use: how future work should consume the context.

Example:

```text
Active context: AGENTS.md and .agents/repo-context.md.
Changes: refreshed verification commands after package scripts changed.
Evidence: package.json defines validate/eval; docs/decisions contains ADRs.
Unknowns: no tracker convention found; ask the user before linking tickets.
Next use: read .agents/repo-context.md after AGENTS.md and before editing.
```

## Checklist

- Existing instructions, docs, configs, and commands were checked before writing.
- The response stayed in read mode unless the user or a repo instruction explicitly authorized context maintenance.
- Every recorded convention is explicit, inferred, or unknown.
- No host, tracker, CI, framework, package manager, or monorepo assumption was introduced.
- Stale entries were updated only when current evidence contradicted them.
- The lesson store path and fallback behavior are clear.
