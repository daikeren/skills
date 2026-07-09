---
name: compound-learning
description: Captures reusable engineering lessons after implementation, review, debugging, incidents, or research. Use when work produced a validated solution, repeated command, decision criterion, pitfall, team convention, or workflow improvement that should make future agent or human work easier.
---

# Compound Learning

## Workflow

1. Capture only validated learning. Do not preserve speculation, transient debugging guesses, or project secrets.
2. Separate reusable lessons from personal defaults. Put generic lessons in the project's shared docs or references; keep personal workflow preferences in user-level instructions or a personal profile, not in shared artifacts.
3. Record the trigger, context, decision, commands, pitfalls, verification evidence, and reuse criteria.
4. Prefer small notes that future agents can scan quickly. Link to source files or PRs when available instead of copying large context.
5. When a lesson changes how a shared skill, checklist, or reference should behave, update that artifact and run whatever checks the project provides.
6. Avoid tool lock-in. Phrase lessons so they apply across agents unless the lesson is inherently tool-specific.

## Output

Return a reusable note with:

- Lesson: one-sentence takeaway.
- Applies when: trigger and boundaries.
- Evidence: what proved it.
- Practice: what to do next time.
- Pitfalls: what not to repeat.
- Candidate home: skill, reference, profile, docs, or external tracker.

Example note:

```text
Lesson: UI-only permission gates always need a matching backend check.
Applies when: reviewing or building admin, billing, or paid features.
Evidence: two review findings where hidden buttons still had live endpoints.
Practice: locate the route or handler permission check before approving.
Pitfalls: trusting component-level visibility as authorization.
Candidate home: security review checklist.
```

## Checklist

- The lesson is validated by a completed implementation, review, incident, or research artifact.
- Public notes exclude secrets, private customer data, and project-specific policy unless explicitly intended.
- Personal preferences stay in optional profiles.
- The note includes trigger, evidence, practice, pitfalls, and candidate home.
- Skill or reference changes are followed by the project's checks when they exist.
