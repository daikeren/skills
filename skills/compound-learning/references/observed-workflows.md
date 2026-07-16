# Observed Workflows

This is the `compound-learning` skill-local public pattern log. The skill appends
validated, reusable lessons here when maintaining this skill pack. Keep entries
generic, small, and evidence-backed; personal preferences belong in user-level instructions,
not here.

## Capture Template

- Lesson:
- Applies when:
- Evidence:
- Practice:
- Pitfalls:
- Candidate home:

## Log

### Descriptions are the routing surface

- Lesson: agents pick skills from descriptions alone, so overlapping trigger nouns across sibling skills cause misrouting.
- Applies when: authoring or editing any skill whose triggers overlap a sibling skill.
- Evidence: four review skills in this pack shared "review", "security", and "product" triggers with no disambiguation until boundary sentences were added.
- Practice: end each description with a boundary sentence naming the sibling to prefer when scope differs.
- Pitfalls: adding trigger keywords to win routing instead of clarifying scope.
- Candidate home: every skill description.

### Shared reference files break standalone installs

- Lesson: content a skill needs to function must live inside the skill directory; paths like `../../references/` disappear when a single skill is installed alone.
- Applies when: a skill workflow depends on a rubric, checklist, or scale.
- Evidence: selective `--skill` installs of this pack drop `references/`, silently weakening review skills that pointed at rubrics.
- Practice: inline load-bearing checklists and scales into `SKILL.md`; keep shared references as optional depth for full installs.
- Pitfalls: letting inlined copies drift from the shared reference; note the mirror relationship in both places.
- Candidate home: skill authoring conventions.

### One worked example beats a field list

- Lesson: models follow output formats far more reliably when the format includes one short rendered example.
- Applies when: a skill's Output section defines a structured format (finding, ticket, evidence row, report).
- Evidence: severity calibration and finding structure in review skills were under-specified by field lists alone; each Output section now carries a compact example.
- Practice: add one 3-6 line fenced example per output format; keep it domain-realistic and severity-calibrated.
- Pitfalls: long multi-section examples that bloat the skill body.
- Candidate home: every skill Output section.

### Repeated same-family findings require an invariant reset

- Lesson: a second confirmed issue in the same state, identity, ordering, or fallback family is evidence that the work lacks an explicit invariant model, not merely another isolated edge case.
- Applies when: implementing or reviewing lifecycle-heavy UI, async integration, retry or fallback logic, temporal workflows, or systems with several representations of the same logical entity.
- Evidence: repeated fix-review passes can validate each local patch while adjacent reachable failures remain in state precedence, prior episodes, alternate identity paths, partial persistence, or broad fallbacks.
- Practice: stop the local patch loop; reconstruct state axes, canonical identity or episode boundary, event order, async ownership, and fallback semantics, then derive adversarial regression coverage before continuing.
- Pitfalls: adding one conditional and one example test per finding, or interpreting repeated review findings as a need for more identical review passes.
- Candidate home: `implement-change` and `review-code` workflows and evals.

## Reference Repos

- `mattpocock/skills`: keep skills small, composable, and daily usable; distinguish user-invoked orchestration from model-invoked discipline; slice work as vertical tracer bullets with blocking edges.
- `obra/superpowers`: make workflows evidence-driven and mandatory at the right moments; package across multiple agent harnesses; verify before claiming completion.
- `everyinc/compound-engineering-plugin`: treat planning, review, and captured learning as compounding infrastructure; make each unit of work improve the next one.
- `addyosmani/agent-skills`: organize skills around the development lifecycle; pair commands with skills; use evals and structural checks to keep quality from drifting.
