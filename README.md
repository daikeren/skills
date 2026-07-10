# Agent Skills for Software Delivery

Reusable agent skills for coding agents that need to operate beyond code generation. The skills in this repository help agents balance product goals, architecture, user impact, security and privacy, cost, operations, and team speed while still shipping small verified changes.

This is a public core, not a company-specific workflow pack. It does not assume GitHub, Linear, Django, Next.js, a monorepo, or any single toolchain. Skills should detect local tooling from the repository, CI, docs, and user-provided context before acting.

## Install

Primary install path:

```bash
npx skills@latest add daikeren/skills
```

Useful variants:

```bash
npx skills@latest add daikeren/skills --list
npx skills@latest add daikeren/skills --skill scope-work --skill review-code
npx skills@latest add daikeren/skills -a codex -a claude-code -a opencode -a pi
```

## Compatibility Notes

The core format follows the open Agent Skills standard: each skill is a directory with `SKILL.md`, required `name` and `description` frontmatter, and optional supporting files.

Codex reads skills from `.agents/skills` in repositories and user-level skill folders. Codex plugins use `.codex-plugin/plugin.json` as the plugin manifest and can point `skills` at `./skills/`.

Claude Code supports standalone `.claude/skills/<name>/SKILL.md` skills and plugin distribution through `.claude-plugin/plugin.json`, with plugin skills stored at the plugin root under `skills/`.

OpenCode loads project and global skills from `.opencode/skills`, `.agents/skills`, and Claude-compatible skill directories.

Pi loads project skills from `.pi/skills` and `.agents/skills`, global skills from `~/.pi/agent/skills` and `~/.agents/skills`, and can also load package-provided `skills/` directories or configured skill paths.

This repo now includes lightweight tool-specific adapters:

- `.codex-plugin/plugin.json` for Codex plugin distribution.
- `.claude-plugin/plugin.json` for Claude Code plugin metadata.
- `.claude/commands/` for Claude Code slash-command wrappers.
- `.opencode/opencode.json` and `.opencode/commands/` for OpenCode command wrappers.
- `.pi/settings.json` and `.pi/extensions/` for Pi skill discovery support.

## Included Skills

- `route-work`: route work to the right focused skill.
- `scope-work`: frame ambiguous or consequential work before execution.
- `research-brief`: produce source-backed research with explicit evidence quality.
- `prototype`: run disposable proof-of-concept exploration without production creep.
- `setup-repo-context`: detect and maintain lightweight repo-specific context from local evidence.
- `strategy-to-options`: turn a strategic question into 2-4 real options.
- `to-spec`: convert an agreed direction into a lightweight implementation spec.
- `to-tickets`: break specs into independently reviewable and releasable slices.
- `architecture-review`: review architecture, dependencies, data flow, and migration risk.
- `product-surface-review`: review workflows, states, accessibility, trust, and support burden.
- `security-privacy-review`: review permissions, sensitive data, trust boundaries, and abuse cases.
- `implement-change`: guide coding work to stay small, idiomatic, reversible, and verified.
- `review-code`: review diffs with attention to regressions, product risk, security/privacy, operations, and tests.
- `compound-learning`: read and capture reusable validated lessons before and after work or review.

## Quick Reference

| I want to... | Use this skill |
| --- | --- |
| Pick the right skill for unclear work | `route-work` |
| Scope ambiguous or high-impact work | `scope-work` |
| Research current facts or evidence | `research-brief` |
| Test an idea with a disposable proof | `prototype` |
| Set up or refresh repo-specific working context | `setup-repo-context` |
| Compare strategic or technical options | `strategy-to-options` |
| Turn a direction into an implementation spec | `to-spec` |
| Slice work into releasable tickets | `to-tickets` |
| Review architecture or migration risk | `architecture-review` |
| Review product surfaces and workflows | `product-surface-review` |
| Review security, privacy, or abuse risk | `security-privacy-review` |
| Implement a small verified change | `implement-change` |
| Review a code diff before release | `review-code` |
| Read or capture reusable lessons | `compound-learning` |

## Repo Shape

```text
skills/                 Agent Skills standard directories and skill-local references
commands/               Generic command wrappers for every skill
references/             Authoring and maintenance rubrics for this pack
evals/cases/            Structural, routing, and behavioral eval cases
evals/fixtures/         Throwaway fixtures for behavioral evals
evals/results/          Generated eval summaries
scripts/                Zero-dependency validation and eval scripts
.codex-plugin/          Codex plugin manifest
.claude-plugin/         Claude Code plugin metadata
.claude/commands/       Claude Code slash commands
.opencode/              OpenCode config and commands
.pi/                    Pi settings and extension metadata
```

## Reference Material

Runtime-essential guidance belongs in the owning skill directory or directly in
that skill's `SKILL.md`, so selective single-skill installs stay complete. The
top-level `references/` directory is authoring and maintenance source material
for this pack, not a runtime dependency for individual skills.

The current top-level references are generic rubrics used to keep skill wording,
review severity, implementation discipline, decision quality, and evidence
standards aligned while maintaining this repository. Skill-specific supporting
material lives with its skill; for example, `compound-learning` keeps its
pack-maintenance workflow log in
`skills/compound-learning/references/observed-workflows.md`.

## Validation

Run:

```bash
npm run validate
npm run eval
```

The validators check skill frontmatter, kebab-case names, description specificity, required body sections, forbidden per-skill READMEs, reference files, manifests, command wrapper parity, eval case JSON shape, and one-to-one coverage between skills and eval datasets. The eval runner performs deterministic routing and sanity checks, reports routing warnings in the terminal, and writes ignored generated output under `evals/results/`.

For opt-in behavioral smoke tests against a real agent:

```bash
LIVE_EVAL_AGENT=codex npm run eval:live
LIVE_EVAL_AGENT=claude-code npm run eval:live
```

The live runner executes each candidate case in a disposable copy of the published repository surfaces, runs the judge from a separate empty temporary directory, rejects unsafe fixture paths and symbolic links, and applies per-command timeouts with process-group cleanup. It writes `evals/results/live-latest.json` in the source checkout. Keep it out of the fast CI gate because it depends on local agent installation, credentials, model availability, and cost.

## Daily Flow

Use `setup-repo-context` when entering a new repository, when local conventions are stale, or when a repo needs a lightweight shared context for agents. Use the `route-work` router when the entry point is unclear. Otherwise, pick the earliest useful phase:

```text
setup-repo-context (optional per repo)
  -> scope-work
  -> strategy-to-options
  -> research-brief or prototype when evidence is missing
  -> to-spec
  -> to-tickets
  -> implement-change
  -> review-code
  -> compound-learning
```

Review-specific shortcuts:

- Use `architecture-review` for service boundaries, data flow, scaling, reliability, migrations, and dependencies.
- Use `product-surface-review` for user workflows, states, trust, support burden, and accessibility.
- Use `security-privacy-review` for auth, permissions, sensitive data, integrations, billing/admin surfaces, and abuse cases.

## Optional Per-Repo Context

`setup-repo-context` helps agents discover repository conventions in read mode and, when the user or a repo instruction explicitly authorizes maintenance, update a compact repo context file. An existing context location selects the target for an authorized write; it is not write authorization by itself. The context should point to existing instructions first and record evidence-backed conventions such as spec and ticket locations, review severity policy, verification commands, tracker/CI/tooling signals, the lesson store path for `compound-learning`, decision records, and AFK handoff expectations.

The skill is intentionally tool-agnostic: it does not require a specific host, issue tracker, CI system, package manager, framework, or monorepo layout. If no repo convention exists, it should return a context snapshot and candidate location rather than silently imposing one.

## Development Loop

Regenerate tool-specific command wrappers from `commands/`:

```bash
npm run sync-commands
```

Dogfood local edits in the next agent session by symlinking skills into a local skill directory:

```bash
npm run link
npm run link -- --agent claude-code
npm run link -- --agent codex
npm run link -- --dry-run
```

Prepare a version bump across package and plugin manifests:

```bash
npm run release:prepare -- 0.2.0
```

Review the generated `CHANGELOG.md` entry before publishing.

## Design Rules

- Keep each skill small, triggerable, and testable.
- Put runtime behavior in `skills/`; keep top-level references limited to authoring and maintenance material.
- Keep personal defaults out of the public core.
- Prefer concise `SKILL.md` files with optional references over large instruction dumps.
- Do not assume a specific repo host, issue tracker, package manager, framework, or CI system.
- Preserve user work and verify the smallest meaningful surface.

## Reference Lessons

This pack borrows the shape, not the bulk, of several public repos:

- `mattpocock/skills`: small, composable, daily-use skills; user-invoked orchestration vs model-invoked discipline; tracer-bullet tickets.
- `obra/superpowers`: evidence-driven workflows, cross-harness packaging, and verification before claiming completion.
- `everyinc/compound-engineering-plugin`: planning, review, and captured learning as compounding engineering infrastructure.
- `addyosmani/agent-skills`: lifecycle commands, reference checklists, and structural/eval gates.

The implementation intentionally stays lighter than a full methodology framework.

## Source Contracts Checked

- Agent Skills specification: https://agentskills.io/specification
- Agent Skills creator quickstart: https://agentskills.io/skill-creation/quickstart
- Codex skills: https://developers.openai.com/codex/skills
- Codex plugin build docs: https://developers.openai.com/codex/plugins/build
- Claude Code skills: https://code.claude.com/docs/en/skills
- Claude Code plugins: https://code.claude.com/docs/en/plugins
- OpenCode skills: https://opencode.ai/docs/skills
- Pi skills: https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md
- skills CLI package: https://www.npmjs.com/package/skills
