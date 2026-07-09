# CTO-Grade Agent Skills

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
npx skills@latest add daikeren/skills --skill cto-intake --skill executive-code-review
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

- `cto`: route CTO-grade work to the right focused skill.
- `cto-intake`: frame ambiguous or consequential work before execution.
- `research-brief`: produce source-backed research with explicit evidence quality.
- `prototype`: run disposable proof-of-concept exploration without production creep.
- `strategy-to-options`: turn a strategic question into 2-4 real options.
- `to-spec`: convert an agreed direction into a lightweight implementation spec.
- `to-tickets`: break specs into independently reviewable and releasable slices.
- `architecture-review`: review architecture, dependencies, data flow, and migration risk.
- `product-surface-review`: review workflows, states, accessibility, trust, and support burden.
- `security-privacy-review`: review permissions, sensitive data, trust boundaries, and abuse cases.
- `implementation-stewardship`: guide coding work to stay small, idiomatic, reversible, and verified.
- `executive-code-review`: review diffs with CTO-grade attention to regressions, product risk, security/privacy, operations, and tests.
- `compound-learning`: capture reusable validated lessons after work or review.

## Repo Shape

```text
skills/                 Agent Skills standard directories
commands/               Generic command wrappers for every skill
references/             Shared rubrics and workflow notes
profiles/generic/       Public default profile
profiles/andy/          Optional Andy-specific profile
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

## Validation

Run:

```bash
npm run validate
npm run eval
```

The validators check skill frontmatter, kebab-case names, description specificity, required body sections, forbidden per-skill READMEs, reference files, manifests, command wrapper parity, and eval case JSON shape. The eval runner performs deterministic sanity checks and writes ignored generated output under `evals/results/`.

For opt-in behavioral smoke tests against a real agent:

```bash
LIVE_EVAL_AGENT=codex npm run eval:live
LIVE_EVAL_AGENT=claude-code npm run eval:live
```

The live runner executes the behavioral cases and writes `evals/results/live-latest.json`. Keep it out of the fast CI gate because it depends on local agent installation, credentials, model availability, and cost.

## Daily Flow

Use the `cto` router when the entry point is unclear. Otherwise, pick the earliest useful phase:

```text
cto-intake
  -> strategy-to-options
  -> research-brief or prototype when evidence is missing
  -> to-spec
  -> to-tickets
  -> implementation-stewardship
  -> executive-code-review
  -> compound-learning
```

Review-specific shortcuts:

- Use `architecture-review` for service boundaries, data flow, scaling, reliability, migrations, and dependencies.
- Use `product-surface-review` for user workflows, states, trust, support burden, and accessibility.
- Use `security-privacy-review` for auth, permissions, sensitive data, integrations, billing/admin surfaces, and abuse cases.

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

Install an optional profile into a chosen user-memory file:

```bash
npm run profile:install -- --profile andy --print
npm run profile:install -- --profile andy --target ~/.claude/CLAUDE.md
```

Prepare a version bump across package and plugin manifests:

```bash
npm run release:prepare -- 0.2.0
```

Review the generated `CHANGELOG.md` entry before publishing.

## Design Rules

- Keep each skill small, triggerable, and testable.
- Put public, generic behavior in `skills/` and `references/`.
- Keep personal defaults in optional profiles, not in the public core.
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
