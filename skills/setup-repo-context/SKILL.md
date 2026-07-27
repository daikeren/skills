---
name: setup-repo-context
description: Detects, creates, and maintains lightweight repository context for agents. Use when onboarding an agent to a repository, setting up or refreshing repo-specific working instructions, finding local conventions for specs, tickets, reviews, verification, lessons, decisions, or AFK handoff, or reconciling stale agent context with current repository evidence. Default to read mode for discovery. Create or update context only when the user explicitly asks or a repo instruction explicitly requires maintenance; an existing context convention alone is not write authorization.
---

# Setup Repo Context

## Workflow

1. Default to read mode. Inspect only the conventions the user asked about, starting with the nearest repo instructions and then the relevant docs, manifests, scripts, configs, work artifacts, and learning stores.
2. Prefer existing convention over new structure. Label a convention `explicit`, `inferred`, or `unknown`; do not turn a prescribed location into a claim that the path currently exists.
3. Answer each requested field completely enough to use. When evidenced, distinguish the authoritative guidance, source artifacts or store, invocation commands, generated outputs, and whether a check is a gate or a diagnostic. Cite direct paths or line ranges.
4. Keep the lookup narrow. Do not append unrelated context categories, generic handoff advice, or future-agent instructions.
5. Write only when the user explicitly asks or a repo instruction explicitly requires maintenance. An existing context path chooses the destination for an authorized write; it does not authorize the write.
6. In write mode, preserve user prose, update only evidence-backed stale fields, mark unresolved conflicts, and use the least tool-specific existing convention. If no target is clear, propose a portable candidate such as `.agents/repo-context.md`.
7. Keep the public core generic: infer no host, tracker, CI, package manager, framework, deployment model, or monorepo layout without evidence.

## Output

In read mode, answer the requested conventions directly, cite the strongest evidence, distinguish documented-but-absent paths from present ones, and say no files changed. Include unknowns only for requested fields.

In write mode, name the active context sources, the exact fields changed or skipped, their evidence status, and unresolved conflicts. Do not copy secrets, private data, credentials, or internal-only policy into public docs; use a documented generator instead of editing generated context.

Example:

```text
Active context: AGENTS.md and .agents/repo-context.md.
Changes: refreshed verification commands after package scripts changed.
Evidence: package.json defines validate/eval; docs/decisions contains ADRs.
Unknowns: no tracker convention found; ask the user before linking tickets.
```

## Checklist

- Existing instructions, docs, configs, and commands were checked before writing.
- The response stayed in read mode unless the user or a repo instruction explicitly authorized context maintenance.
- Every recorded convention is explicit, inferred, or unknown.
- Requested conventions include their useful locations, commands, outputs, and gate semantics when evidenced.
- No host, tracker, CI, framework, package manager, or monorepo assumption was introduced.
- Stale entries were updated only when current evidence contradicted them.
