---
name: compound-learning
description: Reads and writes reusable engineering lessons before and after implementation, review, debugging, incidents, or research. Use when prior lessons may affect the work, or when work produced a validated solution, repeated command, decision criterion, pitfall, team convention, or workflow improvement that should make future agent or human work easier. Default to read/apply mode. Capture or update lessons only when the user explicitly asks or a repo instruction explicitly requires it; an existing lesson store alone is not write authorization.
---

# Compound Learning

## Workflow

1. Read before acting when the task resembles prior implementation, review, debugging, incident, research, or workflow-maintenance work. Check repo instructions and setup context for the configured lesson store path.
2. Choose the mode explicitly. Read/apply mode is the default and never writes. Capture/maintenance mode requires an explicit user request or a repo instruction that explicitly requires lesson maintenance. An existing store decides where an authorized note belongs, not whether it is authorized.
3. If no configured store exists, search likely local lesson homes before deciding there is no prior learning: `.agents/lessons/`, `.agents/lessons.md`, `docs/lessons/`, `docs/lessons.md`, `docs/engineering/lessons/`, `docs/agent-lessons.md`, this skill's `references/observed-workflows.md` when maintaining this pack, postmortems, retrospectives, and runbooks.
4. Query narrowly with task terms, affected files, domains, commands, failure modes, and review lenses. Load only relevant lessons and treat stale lessons as candidates for correction, not unquestioned truth.
5. Apply lessons as working constraints. If current repo evidence conflicts with a lesson, prefer current evidence and note the conflict. Update or supersede the lesson only in authorized capture/maintenance mode; otherwise recommend the change without writing it.
6. Capture only validated learning. Do not preserve speculation, transient debugging guesses, secrets, private customer data, or one-off trivia.
7. Separate reusable lessons from personal defaults. Put generic lessons in shared docs or references, repo-specific lessons in the configured repo store, and personal workflow preferences in user-level instructions.
8. Record the trigger, context, decision, commands, pitfalls, verification evidence, and reuse criteria.
9. Prefer small notes that future agents can scan quickly. Link to source files, commits, tickets, PRs, incidents, or command output when available instead of copying large context.
10. When an authorized maintenance task shows that a shared skill, checklist, or reference should change, update that artifact and run whatever checks the project provides. Otherwise return the recommended change without editing the shared artifact.
11. Avoid tool lock-in. Phrase lessons so they apply across agents unless the lesson is inherently tool-specific.

## Lesson Store

After capture/maintenance mode is authorized, use this precedence to decide where lessons live:

1. A path named by the user for the current task.
2. A `learning store path` or equivalent field from repo setup context.
3. A repo instruction or contribution doc that names a lessons, workflow, retrospective, or knowledge-capture location.
4. An existing lesson file or directory in the likely homes listed in the workflow.
5. For an explicitly authorized maintenance task in this public skill pack, this skill's `references/observed-workflows.md` for generic evidence-backed workflow lessons.
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
- Candidate home: skill, reference, docs, or external tracker.
- Store action: read, recommended, appended, created, updated, superseded, or skipped.

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

In authorized capture/maintenance mode, update a shared skill, checklist, or reference instead of only writing a lesson when:

- The lesson changes a repeatable workflow step, trigger boundary, output format, checklist, rubric, or verification command.
- The same lesson appears repeatedly across projects or reviews.
- Future agents would miss the lesson unless it is in the skill they already load.
- A prior skill instruction caused the mistake or failed to prevent it.

Keep project-specific policy, credentials, private operating details, and personal preferences out of public shared skills.
If shared-artifact maintenance is not authorized, return the proposed change and evidence instead of editing it.

## Checklist

- Relevant lesson stores were searched before acting when prior learning could matter.
- The response stayed in read/apply mode unless the user or a repo instruction explicitly authorized lesson maintenance.
- The lesson is validated by a completed implementation, review, incident, or research artifact.
- Public notes exclude secrets, private customer data, and project-specific policy unless explicitly intended.
- Personal preferences stay out of public shared skills.
- The note includes searchable metadata or equivalent bullets, trigger, evidence, practice, pitfalls, candidate home, and store action.
- Skill or reference changes are followed by the project's checks when they exist.
