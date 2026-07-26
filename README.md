# Agent Skills for Software Delivery

[English](README.md) | [繁體中文（台灣）](README.zh-TW.md)

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

- `route-work`: recommend the smallest sufficient path across direct action, skills, and other available capabilities.
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
- `understand-change`: teach a change in learning order with the lightest useful chat, diagram, or disposable HTML medium.
- `review-code`: review diffs with attention to regressions, product risk, security/privacy, operations, and tests.
- `compound-learning`: read and capture reusable validated lessons before and after work or review.

## Quick Reference

| I want to... | Use this skill |
| --- | --- |
| Pick a proportionate path for unclear work | `route-work` |
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
| Build a mental model of a code change | `understand-change` |
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
npm run diagnose:routing
```

Validation errors are the deterministic hard gate. The validators check skill frontmatter, kebab-case names, description specificity, required body sections, forbidden per-skill READMEs, reference files, manifests, command wrapper parity, eval case JSON shape, fixture safety, and one-to-one coverage between skills and eval datasets.

The routing diagnostic compares prompts with skill descriptions using a deterministic lexical heuristic. Positive, negative, boundary, and margin mismatches are non-blocking authoring signals. Validation also reports pairwise description-similarity as a non-blocking diagnostic. These heuristics are not the routing mechanism used by real agents. The routing command writes ignored generated output under `evals/results/`. `npm run eval` remains as a compatibility alias for the same diagnostic.

For opt-in behavioral evaluation against a real agent:

```bash
LIVE_EVAL_AGENT=codex npm run eval:live
LIVE_EVAL_AGENT=claude-code npm run eval:live
```

To run only selected cases:

```bash
LIVE_EVAL_AGENT=codex \
LIVE_EVAL_CASES=implement-change/cross-stack-change,review-code/permission-regression \
npm run eval:live
```

To add a second, comparative layer for the same selected tasks:

```bash
LIVE_EVAL_AGENT=codex \
LIVE_EVAL_CASES=understand-change/small-change-uses-chat,route-work/direct-low-risk-path \
LIVE_EVAL_COMPARE_BASELINE=1 \
npm run eval:live
```

Cases run with bounded concurrency `4` by default. Override it when local or provider limits require a different value:

```bash
LIVE_EVAL_AGENT=codex \
LIVE_EVAL_COMPARE_BASELINE=1 \
LIVE_EVAL_CONCURRENCY=2 \
npm run eval:live
```

Use repeated paired trials when deciding whether a skill contract should change:

```bash
LIVE_EVAL_AGENT=codex \
LIVE_EVAL_CASES=review-code/release-disposition-tail-risk,understand-change/cross-layer-adaptive-medium \
LIVE_EVAL_COMPARE_BASELINE=1 \
LIVE_EVAL_REPEATS=3 \
npm run eval:live
```

Each `(case, trial)` is an independent concurrency unit. The comparison judge sees blinded `Response A` and `Response B` labels, with candidate and baseline positions alternating by trial. `live-latest.json` retains every ordered trial and adds per-case aggregates: contract pass/fail/review rates, comparative majority and win rates, and median candidate, baseline, and paired-delta measurements. A strict majority is required; split outcomes aggregate to `review` rather than hiding variance.

Contract checks remain the correctness gate: they verify that the skill follows its intended behavior. A genuinely conditional expectation may opt in to `not-applicable` with `{ "text": "When ...", "allowsNotApplicable": true }`; when its condition does not hold, this counts as a completed check rather than an ambiguous review. Plain strings never allow `not-applicable`, so exhaustive branches and missing behavior or evidence cannot be skipped accidentally. Comparative mode runs candidate and baseline in matched task workspaces with all skill runtime surfaces removed. The candidate receives only the selected skill bundle inline; the baseline receives an explicit no-skill prompt. The judge compares task success, missed risks, and unnecessary steps while recording elapsed time, output size, artifacts, and harness-observable tool calls. Codex also uses an isolated temporary home, so its baseline cannot discover installed user skills; other harnesses are labeled as prompt-isolated when their global skill home cannot be safely replaced. The target is repeatable net improvement: extra work is justified when it produces material quality or risk reduction, while equal task quality plus avoidable burden is a regression rather than success. A task that needs no added judgment should normally bypass the skill. Comparative results are diagnostics rather than a hard gate while model and harness baselines remain variable; use repeated targeted runs before changing a skill contract.

Codex runs use JSONL telemetry to count completed command, file-change, MCP, and web-search actions. The contract judge also receives a bounded, redacted execution trace so process expectations can be checked against observed actions instead of final-answer narration alone. Command output, raw command arguments, MCP arguments, and web-search queries are omitted. Commands are reduced to an allowlisted structural summary of known tools and safe actions such as `npm run validate` or `git status`; unknown commands are recorded only as `other`. The sanitized trace is retained with the candidate result for auditability. A harness that does not expose reliable structured telemetry records unavailable evidence instead of estimating it. A single elapsed-time sample is directional evidence, not a benchmark.

The live runner executes case trials concurrently while keeping the phases inside each trial ordered. It logs case, trial, and phase start/completion, elapsed time, and aggregate progress to stderr and persists the same timestamped stream in ignored `evals/results/live-progress.log`, without echoing prompts or fixture contents. Every candidate and baseline uses its own disposable matched task-workspace copy with skill runtime surfaces, eval definitions, results, and unrelated fixtures removed; the selected skill bundle and case fixture are supplied only through the candidate prompt. Codex also uses a private temporary home containing only the authentication file, and judges run from separate empty temporary directories. The runner rejects unsafe fixture paths and symbolic links and applies per-command timeouts with process-group cleanup. On normal exit, `SIGHUP`, `SIGINT`, or `SIGTERM`, it removes active process trees, temporary workspaces, and credential copies. A hard kill or host failure can still leave temporary credential residue that must be removed manually. The runner writes ordered trial results, aggregates, concurrency, repeats, and total duration to `evals/results/live-latest.json` in the source checkout. Keep it out of the fast CI gate because it depends on local agent installation, credentials, model availability, and cost.

## Daily Flow

Use `setup-repo-context` when entering a new repository, when local conventions are stale, or when a repo needs a lightweight shared context for agents. Use `route-work` when the entry point is unclear. The following flow is an advisory map, not a required pipeline: agents may enter, skip, combine, reorder, or leave phases when the task, risk, and available capabilities justify it.

```text
setup-repo-context (optional per repo)
  -> scope-work
  -> strategy-to-options
  -> research-brief or prototype when evidence is missing
  -> to-spec
  -> to-tickets
  -> implement-change
  -> understand-change (when the author or reviewer needs a mental model)
  -> review-code
  -> compound-learning
```

Review-specific shortcuts:

- Use `architecture-review` for service boundaries, data flow, scaling, reliability, migrations, and dependencies.
- Use `product-surface-review` for user workflows, states, trust, support burden, and accessibility.
- Use `security-privacy-review` for auth, permissions, sensitive data, integrations, billing/admin surfaces, and abuse cases.

Use `understand-change` before review when the missing gate is human understanding rather than another correctness check. It chooses the lightest useful teaching medium: concise chat, structured explanation or diagrams, or a disposable HTML explainer when the user requests one or an interactive, reusable, cross-layer, or dynamic surface materially improves learning. Small self-contained changes can be explained directly without forced evidence, validation, or readiness sections. Producing an explanation never proves understanding; evaluate the learner's answers when a real understanding gate is required.

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
- `humanlayer/advanced-context-engineering-for-coding-agents`: intentional context compaction, high-leverage human alignment, and compact program-shape decisions before complex vertical slices.

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
