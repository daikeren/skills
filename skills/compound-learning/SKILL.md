---
name: compound-learning
description: Reads and writes reusable engineering lessons before and after implementation, review, debugging, incidents, or research. Use when prior lessons may affect the work, or when work produced a validated solution, repeated command, decision criterion, pitfall, team convention, or workflow improvement that should make future agent or human work easier.
---

# Compound Learning

## Workflow

1. Read before acting when the task resembles prior implementation, review, debugging, incident, research, or workflow-maintenance work. Check repo instructions and setup context for the configured lesson store path.
2. If no configured store exists, search likely local lesson homes before deciding there is no prior learning: `.agents/lessons/`, `.agents/lessons.md`, `docs/lessons/`, `docs/lessons.md`, `docs/engineering/lessons/`, `docs/agent-lessons.md`, this skill's `references/observed-workflows.md` when maintaining this pack, postmortems, retrospectives, runbooks, and optional profiles for personal preferences.
3. Query narrowly with task terms, affected files, domains, commands, failure modes, and review lenses. Load only relevant lessons and treat stale lessons as candidates for correction, not unquestioned truth.
4. Apply lessons as working constraints. If current repo evidence conflicts with a lesson, prefer current evidence, note the conflict, and update or supersede the lesson when the work validates the change.
5. Capture only validated learning. Do not preserve speculation, transient debugging guesses, secrets, private customer data, or one-off trivia.
6. Separate reusable lessons from personal defaults. Put generic lessons in shared docs or references, repo-specific lessons in the configured repo store, and personal workflow preferences in user-level instructions or a personal profile.
7. Record the trigger, context, decision, commands, pitfalls, verification evidence, and reuse criteria.
8. Prefer small notes that future agents can scan quickly. Link to source files, commits, tickets, PRs, incidents, or command output when available instead of copying large context.
9. When a lesson changes how a shared skill, checklist, or reference should behave, update that artifact and run whatever checks the project provides.
10. Avoid tool lock-in. Phrase lessons so they apply across agents unless the lesson is inherently tool-specific.

## Lesson Store

Use this precedence to decide where lessons live:

1. A path named by the user for the current task.
2. A `learning store path` or equivalent field from repo setup context.
3. A repo instruction or contribution doc that names a lessons, workflow, retrospective, or knowledge-capture location.
4. An existing lesson file or directory in the likely homes listed in the workflow.
5. For this public skill pack, this skill's `references/observed-workflows.md` for generic evidence-backed workflow lessons.
6. If no store exists, return the lesson note with a candidate home and ask before creating a new repository convention.

Prefer one lesson per Markdown file when the repo has a lesson directory. Use an aggregate log when that is the existing convention.

For one-file-per-lesson stores, use small YAML frontmatter:

```yaml
---
title: "UI permission gates need backend checks"
date: "2026-07-09"
scope: "repo"
tags: ["permissions", "review"]
source: "review"
evidence: "review finding plus failing authorization test"
applies_when: "building or reviewing admin, billing, or paid features"
supersedes: ""
---
```

For aggregate logs, preserve the local format and include the same fields as compact bullets under the lesson heading when practical.

## Output

When reading lessons before work, return or carry forward:

- Lessons checked: store paths or search patterns.
- Relevant lessons: the short takeaways that affect this task.
- Applied constraint: how the lesson changes the next action.
- Stale or conflicting lessons: what current evidence contradicts.

When capturing learning, return a reusable note with:

- Lesson: one-sentence takeaway.
- Applies when: trigger and boundaries.
- Evidence: what proved it.
- Practice: what to do next time.
- Pitfalls: what not to repeat.
- Candidate home: skill, reference, profile, docs, or external tracker.
- Store action: read, appended, created, updated, superseded, or skipped.

Example note:

```text
Lesson: UI-only permission gates always need a matching backend check.
Applies when: reviewing or building admin, billing, or paid features.
Evidence: two review findings where hidden buttons still had live endpoints.
Practice: locate the route or handler permission check before approving.
Pitfalls: trusting component-level visibility as authorization.
Candidate home: security review checklist.
Store action: appended to docs/lessons/security.md.
```

## Updating Shared Skills

Update a shared skill, checklist, or reference instead of only writing a lesson when:

- The lesson changes a repeatable workflow step, trigger boundary, output format, checklist, rubric, or verification command.
- The same lesson appears repeatedly across projects or reviews.
- Future agents would miss the lesson unless it is in the skill they already load.
- A prior skill instruction caused the mistake or failed to prevent it.

Keep project-specific policy, credentials, private operating details, and personal preferences out of public shared skills.

## Checklist

- Relevant lesson stores were searched before acting when prior learning could matter.
- The lesson is validated by a completed implementation, review, incident, or research artifact.
- Public notes exclude secrets, private customer data, and project-specific policy unless explicitly intended.
- Personal preferences stay in optional profiles.
- The note includes searchable metadata or equivalent bullets, trigger, evidence, practice, pitfalls, candidate home, and store action.
- Skill or reference changes are followed by the project's checks when they exist.
