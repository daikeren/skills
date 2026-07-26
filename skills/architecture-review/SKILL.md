---
name: architecture-review
description: Reviews designs, docs, code, dependencies, data models, scaling paths, reliability, complexity, and maintenance risk. Use when evaluating architecture, major refactors, platform choices, migration plans, service boundaries, data flow, or operational risk. For reviewing a concrete code diff across all lenses, use review-code instead.
---

# Architecture Review

## Workflow

1. Start read-only. Inspect the request and only the architecture evidence needed to resolve it. When a complete bounded design, migration plan, or diff is supplied, use it directly; do not search unrelated repository surfaces or run validation commands unless they could change the recommendation.
2. Stay report-only. Inspect and report findings or recommendations; do not edit code, docs, diagrams, or configuration unless the user explicitly changes the task from review to fix.
3. Map current architecture before judging it: modules, boundaries, data flow, runtime paths, integrations, trust boundaries, and ownership. Start from entry points, dependency manifests, schema or migration directories, and deploy/CI configuration, and trace at least one primary runtime path end to end.
4. Evaluate fitness against product goals, expected scale, failure modes, operational burden, security/privacy, cost, and team capacity.
5. Distinguish current defects or regressions from optional future improvements and missing validation. Prefer fewer, higher-leverage recommendations.
6. If useful for stakeholders, draw Mermaid diagrams for current/proposed architecture, data flow, sequence, boundaries, risk hotspots, and migration phases. Produce an HTML report file only when the user asks for one, and note that Mermaid blocks need a renderer to display.
7. Recommend a target shape or migration only when the user asks for a proposed direction or a validated finding requires structural change. When migration is warranted, make it reversible with validation checkpoints and rollback paths; otherwise stop at current-state findings and residual risk.
8. Scale the review to the decision. When a bounded question can be answered from a few decisive facts, return the recommendation, supporting evidence, material risks, and revisit conditions directly. Do not add diagrams, exhaustive dimension-by-dimension commentary, validation commands, or finding metadata unless they expose a risk, resolve uncertainty, or help the audience act.

## Output

For a substantial review, return the useful subset of:

- Executive summary: decision, confidence, and top risks.
- Current architecture: concise map of what exists.
- Findings: severity, confidence, likelihood, disposition, type, evidence, impact, and smallest credible fix direction.
- Open questions: only items that change the decision.

When the target is a concrete change or release, state `Block`, `Approve with follow-ups`, or `Approve`, and explicitly say `No blocking findings` when appropriate.

For a narrow decision with no actionable defect, a concise recommendation and rationale are sufficient. Include diagrams only when requested or when they materially clarify relationships that prose would obscure: Mermaid blocks inline, or an HTML report file when requested.

Use severity, likelihood, confidence, disposition, and defect-type metadata for actionable findings or missing release validation. Do not manufacture a finding wrapper around an advisory recommendation, an accepted tradeoff, or a no-change conclusion merely to fill the template.

Return these only when the user requests them or a finding requires structural change:

- Proposed direction: target shape and why it fits.
- Migration plan: phases, compatibility, rollout, verification, and rollback.

Use severity for impact if the issue occurs, independent of release disposition:

- `[P0]` catastrophic impact such as active compromise, irrecoverable data loss, widespread outage, or irreversible destructive behavior.
- `[P1]` serious user or business harm, authorization/privacy break, migration corruption, or major operational failure.
- `[P2]` moderate bug, missing guardrail, important test gap, or maintainability issue with plausible near-term cost.
- `[P3]` low-risk issue that still affects correctness, clarity, or future review.

Use confidence labels:

- High: directly observed in code, diff, design, or behavior with an unambiguous trace to impact.
- Medium: supported by concrete evidence, but one assumption remains about runtime behavior, configuration, user path, or intended policy.
- Low: plausible risk with incomplete evidence; keep the impact severity conditional and state the assumption or open question that needs validation.

Also label likelihood as High, Medium, or Low based on path exposure and required preconditions, then assign `Blocking`, `Non-blocking`, or `Follow-up`. Do not conflate likelihood with evidence confidence or impact severity. Low-likelihood issues still block when failure would be catastrophic, irreversible, difficult to contain or recover from, cross a tenant or permission boundary, corrupt data or migrations, or create incorrect financial effects. Limited and recoverable low-likelihood issues are usually non-blocking or follow-up work.

Keep severity tied to conditional impact rather than evidence certainty. Blocking dispositions require concrete evidence of a reachable risk or a missing required high-risk release gate: cite a file:line or surface reference plus a short quote or paraphrase of the offending line, state, behavior, or validation gap when available. If reachability cannot be supported, keep the severity conditional, lower confidence, and move the item to assumptions or open questions rather than blocking. Classify each finding as `current defect/regression`, `missing validation`, or `optional improvement`. Recommend a separate follow-up ticket only for independently actionable work, and state why it can wait plus the completion signal.

Example finding:

```text
[P2][Medium confidence][Medium likelihood][Follow-up] services/orders.py:142 -
Order service reads the payments database directly. Type: current
defect/regression. Evidence: query uses `payments_db.session` instead of the
payments client. Impact: schema changes require lockstep deploys. Fix: move the
queries behind the existing payments client and remove the DB grant.
```

## Checklist

- Boundaries, data flow, dependencies, trust boundaries, and ownership are mapped.
- Product value, reliability, security/privacy, cost, operations, and team capacity are evaluated.
- Findings distinguish current defects from future optional improvements.
- Findings distinguish impact, evidence confidence, occurrence likelihood, and merge/release disposition.
- Low-likelihood catastrophic or irreversible tail risks remain blocking.
- Proposed direction and migration are omitted when current-state findings do not justify structural change.
- When migration is warranted, its phases preserve compatibility and include rollback, monitoring, and validation checkpoints.
