# Skill Value Contracts and Provisional Portfolio Review

Reviewed: 2026-07-30
Repository snapshot: [`99e01a1a59ee5f3db65aabea0f52684a922c75ac`](https://github.com/daikeren/skills/tree/99e01a1a59ee5f3db65aabea0f52684a922c75ac)
Decision input: [GitHub issue #3](https://github.com/daikeren/skills/issues/3)
Evaluation-workflow dependency: [GitHub issue #2](https://github.com/daikeren/skills/issues/2)

## Decision

The repository has 15 current skills and 15 matching evaluation datasets. All
15 are reconciled below. None is currently a `default candidate`: the tracked
repository proves structural coverage and contract intent, but it does not yet
contain a representative, durable comparison against a frozen same-goal terse
instruction.

The provisional disposition is intentionally multi-axis so structural scope is
not mistaken for evidence maturity or deployment policy:

- **Structural role:** `standalone boundary`, `umbrella boundary`,
  `adjacent handoff boundary`, or `overlap boundary unresolved`.
- **Invocation mode:** `explicit-only` until replicated routing and marginal
  value support `default candidate`.
- **Evidence maturity:** `unknown`, `contract-only`, `comparative`, or
  `replicated`.
- **Provisional action:** `none`, `benchmark priority`, `merge study`, or
  `retirement study`.

These are benchmark-design hypotheses, not final keep, merge, or removal
decisions. All 15 skills remain `explicit-only` and `contract-only`; none has the
replicated marginal benefit, routing, burden, and robustness evidence required
for default use.

## Evidence boundary

### Verified from the reviewed repository

- There are exactly 15 directories containing `skills/*/SKILL.md` and exactly 15
  matching `evals/cases/*.json` datasets. The current datasets contain 44
  behavioral cases. The one-to-one relation is a deterministic validation gate;
  routing diagnostics remain non-blocking lexical signals ([validation and eval
  documentation](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/README.md#validation)).
- Current cases encode contract and routing expectations. They can show whether
  a skill follows its authored behavior; they are not, by themselves, evidence
  that the behavior improves real engineering outcomes over a capable model.
- The [live harness](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/scripts/run-live-evals.js)
  currently supplies an explicit no-skill baseline and records
  contract checks, blinded comparison judgments, timing, output size, artifacts,
  and available tool/token telemetry. Issue #2 correctly treats a frozen
  same-goal terse instruction, durable run identity, independent review, and
  calibrated aggregation as unfinished evaluation work.
- The linked [GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model)
  supports lean, outcome-focused prompts: supply relevant context, hard
  constraints, approval boundaries, required evidence, and success criteria;
  remove procedural detail only through representative evaluation rather than
  assuming that shorter or longer is better.

### Excluded historical observations

Ignored local live-result files were inspected during discovery, but they are not
admitted as disposition evidence. The repository's pinned
[generated-result policy](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/.gitignore#L7-L8)
excludes those result files from a fresh clone. Because no durable result source
is linked, their model/configuration, input revisions, and baseline cannot be
independently verified. Issue #2 identifies the durable evidence layout required
before later portfolio decisions can depend on any run.

No counts, comparisons, or skill-level conclusions from the ignored files are
carried into the contracts below. Inference is labeled as such. A proposed value
mechanism remains a hypothesis until a representative, reviewable oracle
distinguishes task outcome or material risk reduction from contract imitation,
verbosity, or ceremony.

## Evaluation contract

Every value hypothesis must be tested on six separate dimensions:

| Dimension | Question | Evidence type |
| --- | --- | --- |
| Contract adherence | Did the selected skill satisfy its stated contract? | Deterministic checks where possible; bounded contract judge otherwise |
| Routing quality | Was the skill selected for positive cases and bypassed for routine, negative, and sibling-boundary cases? | Selection-only use/bypass suite; lexical diagnostics are authoring signals only |
| Task outcome | Is the completed work more correct, useful, or decision-ready? | Task-specific independent oracle, executable check, or blinded review |
| Risk reduction | Did the skill find or prevent a material reachable failure that the baseline missed? | Seeded hazard, invariant, independent reproduction, or calibrated expert review |
| Burden | What extra context, output, tools, time, user interaction, and review effort did it require? | Per-arm measurements and human-review burden |
| Robustness | Does the result hold across repeats and relevant task variants? | Counterbalanced repeated trials, disagreement and failure retention |

The primary arm is the full current skill versus a frozen instruction. Only the
goal, inputs, context, constraints, approval boundary, evidence requirements,
success criteria, and output need supplied by the fixture, user, or repository
are held constant. A decision or requirement introduced by the skill is treatment
and must not leak into the terse arm. The table below names that treatment for
every skill. A no-instruction arm answers a different causal question and cannot
replace it.

| Skill | Decisions present only in the skill arm |
| --- | --- |
| `architecture-review` | Current-state map before target design; defect versus improvement; reversible migration gates |
| `compound-learning` | Capture authority; validation threshold; store selection and privacy boundary |
| `implement-change` | State/identity checkpoint; semantic scope reconciliation; independent verification amplification |
| `product-surface-review` | Journey/state tracing; informed-intent and authoritative-outcome checks; recovery focus |
| `prototype` | Fidelity gate; falsifier and independent oracle; discard boundary |
| `research-brief` | Evidence-type separation; freshness test; evidence-sufficiency handoff gate |
| `review-code` | Independent multi-lens aggregation; temporal/state reconstruction; severity-first deduplication |
| `route-work` | Readiness, fidelity, and bypass selection; smallest-sufficient route |
| `scope-work` | Decision-changing constraint pressure test; user-owned decision versus safe assumption |
| `security-privacy-review` | Asset/actor/boundary map; backend enforcement and minimization; tail-risk disposition |
| `setup-repo-context` | Explicit/inferred/unknown labels; maintenance authorization; later-reuse boundary |
| `strategy-to-options` | Evidence-readiness gate; symmetric option dimensions; defer/no-build and choose-when rules |
| `to-spec` | Readiness gate; accepted/proposed/open separation; validation seams and decision handoff |
| `to-tickets` | Dependency frontier; tracer-bullet slicing; expand-contract and rollback sequencing |
| `understand-change` | Learner calibration; one causal trace; medium choice and transfer gate |

For the benchmark-design gate, use at least two task families per skill: a
representative positive-use family (consequential where risk reduction is part of
the claim) and a routine, negative, or sibling-boundary family. Treat three paired
repeats per family, at least two concordant results in
each family, no critical regression, and routing use/bypass accuracy of at least
five of six as a minimum decision sample—not as statistical proof. Burden remains
a vector: context, output, tools, elapsed time, user interactions, and expert
review effort must not be collapsed into one percentage. Each contract declares
one primary burden metric and no-worse guardrails; minimum-effect thresholds are
calibrated after the first pilot rather than assumed here.

Human-judged outcome oracles must be blind to arm identity and anchored to hidden
facts, a downstream decision, successful transfer, or another observable task
result. Named sections, prose length, trigger compliance, and format conformity
score only under contract adherence, never as task value.

## Inventory reconciliation

Skill and dataset links are pinned to the reviewed commit. `E` means
`explicit-only`; `C` means `contract-only`.

| # | Skill contract | Eval mapping | Cases | Structural role | Mode / evidence | Provisional action |
| ---: | --- | --- | ---: | --- | --- | --- |
| 1 | [`architecture-review`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/architecture-review/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/architecture-review.json) | 3 | standalone boundary | E / C | benchmark priority |
| 2 | [`compound-learning`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/compound-learning/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/compound-learning.json) | 2 | standalone boundary | E / C | benchmark priority |
| 3 | [`implement-change`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/implement-change/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/implement-change.json) | 6 | standalone boundary | E / C | benchmark priority |
| 4 | [`product-surface-review`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/product-surface-review/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/product-surface-review.json) | 1 | overlap boundary unresolved | E / C | benchmark priority |
| 5 | [`prototype`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/prototype/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/prototype.json) | 5 | standalone boundary | E / C | benchmark priority |
| 6 | [`research-brief`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/research-brief/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/research-brief.json) | 2 | standalone boundary | E / C | benchmark priority |
| 7 | [`review-code`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/review-code/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/review-code.json) | 6 | umbrella boundary | E / C | benchmark priority |
| 8 | [`route-work`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/route-work/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/route-work.json) | 5 | standalone boundary | E / C | benchmark priority |
| 9 | [`scope-work`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/scope-work/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/scope-work.json) | 1 | adjacent handoff boundary | E / C | merge study |
| 10 | [`security-privacy-review`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/security-privacy-review/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/security-privacy-review.json) | 2 | overlap boundary | E / C | benchmark priority |
| 11 | [`setup-repo-context`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/setup-repo-context/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/setup-repo-context.json) | 2 | overlap boundary unresolved | E / C | benchmark priority |
| 12 | [`strategy-to-options`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/strategy-to-options/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/strategy-to-options.json) | 1 | adjacent handoff boundary | E / C | merge study |
| 13 | [`to-spec`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/to-spec/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/to-spec.json) | 1 | adjacent handoff boundary | E / C | merge study |
| 14 | [`to-tickets`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/to-tickets/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/to-tickets.json) | 4 | adjacent handoff boundary | E / C | merge study |
| 15 | [`understand-change`](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/skills/understand-change/SKILL.md) | [dataset](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/evals/cases/understand-change.json) | 3 | standalone boundary | E / C | benchmark priority |
|  | **Total** | **15 matching datasets** | **44** | **15 reconciled** | **0 default candidates** | **11 benchmark / 4 merge** |

## Overlap map

| Surface | Skills | Boundary to preserve or test | Overlap hypothesis |
| --- | --- | --- | --- |
| Full versus specialist review | `review-code`; `architecture-review`; `product-surface-review`; `security-privacy-review` | Full concrete diff across lenses routes to `review-code`; a single deep design, product, or trust-boundary question routes to the specialist | Specialists may improve depth and reduce irrelevant findings, but repeated severity/output machinery may add context with no outcome gain |
| Problem framing and choice | `scope-work`; `research-brief`; `strategy-to-options`; `prototype` | Scope when the frame is unstable; research when current facts are missing; options when evidence is sufficient; prototype when an observable artifact is needed | `scope-work` and `strategy-to-options` may be one adaptive decision contract; research and prototype retain distinct evidence modes |
| Routing versus execution | `route-work` and every other skill | Use the router only when path selection is itself uncertain; bypass it for already-bounded work | Router value is selection accuracy and avoided ceremony, not quality of a forced downstream answer |
| Production change versus disposable proof | `implement-change`; `prototype` | Retained production work belongs to `implement-change`; a prototype is primary only when learning is the requested outcome | Disposable evidence amplification may be a checkpoint inside implementation, while standalone prototyping remains explicit |
| Chosen direction to delivery units | `to-spec`; `to-tickets` | Spec owns external behavior and accepted decisions; tickets own independently releasable slices and dependency order | One contract compiler may preserve the spec-to-ticket handoff with less repeated repo discovery and ceremony |
| Repository and human context | `setup-repo-context`; `compound-learning`; `understand-change` | Context records conventions; learning records validated reusable lessons; understanding teaches a concrete change | All externalize context, but their oracles differ: factual snapshot, future reuse, and learner transfer. Shared output mechanics are not enough to justify a merge |
| Cross-cutting implementation/review judgment | `implement-change`; `review-code`; specialist reviews | Implementation changes retained code; all reviews stay report-only | Stateful, risk, and evidence checkpoints overlap intentionally; evaluation must show whether duplication prevents errors or merely repeats base-agent policy |

Every material overlap is evaluated with three predeclared fixture classes.
Routing is scored only on exclusive cases; task outcome is compared only on the
dual-eligible intersection. Multiple routes are not an error when the acceptable
set below permits composition.

| Surface | A-exclusive fixtures | B-exclusive fixtures | Dual-eligible intersection and acceptable routes |
| --- | --- | --- | --- |
| Full versus specialist review | Full concrete diffs with material findings across two or more lenses: `review-code` | Design-only, product-only, or trust-boundary-only questions: the matching specialist | Concrete diff dominated by one specialist lens: either `review-code`, the specialist, or their composition; compare lens ablation on outcome, false positives, and burden |
| Scope versus research | Unstable frame without a bounded evidence question: `scope-work` | Framed decision with a current-fact gap: `research-brief` | Unstable frame whose path depends on one current fact: `scope-work` then `research-brief`, or an equivalent adaptive composition |
| Scope versus options | Unstable frame: `scope-work` | Framed and sufficiently evidenced choice: `strategy-to-options` | Partially framed decision with remaining decision-changing constraints: scope then options, or an adaptive composition; score readiness and option validity |
| Research versus options | Current-fact conclusion is the requested outcome: `research-brief` | Evidence is already sufficient and a choice is requested: `strategy-to-options` | Choice requires one bounded current-fact update: research then options; both steps or an equivalent composition are acceptable |
| Research versus prototype | Current external facts can answer without an artifact: `research-brief` | A local observable question has sufficient facts but needs an artifact: `prototype` | An external capability claim needs local empirical validation: research then prototype, or an equivalent composition; score source accuracy and observed falsification separately |
| Options versus prototype | Evidence can distinguish feasible options without building: `strategy-to-options` | One chosen uncertainty requires observation: `prototype` | An option depends on an observable assumption: options then prototype then revised recommendation; ordered composition is acceptable |
| Scope versus prototype | No falsifiable learning question yet: `scope-work` | Falsifiable question and safe proving ground already exist: `prototype` | Frame can be bounded only by one observation: scope then prototype, or an adaptive composition; score decision movement and artifact containment |
| Routing versus execution | Ambiguous capability path: `route-work` | Already-bounded work: direct execution skill | Genuine multiple-capability case: router plus accepted downstream path or a direct accepted composition |
| Production versus disposable proof | Retained production outcome: `implement-change` | Disposable learning outcome: `prototype` | Retained change needing a subordinate probe: `implement-change` with embedded prototype step or explicit composition |
| Spec versus tickets | Reusable external behavior contract: `to-spec` | Adequate existing spec needing delivery slices: `to-tickets` | Chosen direction needing both artifacts: separate sequence or merged projection; compare fidelity, dependency safety, and burden |
| Repository, lesson, and learner context | Repository conventions: `setup-repo-context`; validated reusable lesson: `compound-learning` | Concrete-change teaching: `understand-change` | Change reveals a reusable convention or lesson: any necessary ordered composition; each artifact keeps its own factual/reuse/transfer oracle |
| Implementation versus review | Requested retained change: `implement-change` | Report-only release or specialist decision: the matching review skill | Change followed by independent review: ordered composition; never score the report-only arm as failing because it did not edit |

For product/security intersections such as billing, admin, and destructive
workflows, both specialist routes and their composition are acceptable on
intersection fixtures. For architecture/security intersections, both routes and
composition are likewise acceptable when system-boundary and threat-boundary
judgment are independently material.

## Skill Value Contracts

### 1. `architecture-review`

- **Outcome:** a decision-maker receives an evidence-backed verdict about current
  boundaries, data flow, reliability, operations, and migration risk without an
  unjustified redesign.
- **Unique value hypothesis:** mapping current architecture before recommending a
  target, separating defects from optional improvements, and requiring reversible
  migration gates will prevent premature service splits and expose operational or
  tail risks missed by a terse architecture-review request.
- **Apply / bypass:** apply to architecture, platform, service-boundary, scaling,
  and migration decisions; bypass for a full concrete diff or a product-only
  surface review.
- **Contract:** input is a bounded design, plan, code surface, and decision
  context. Output is a verdict, current-state map, decisive findings, and only a
  justified target or migration. Oracle is an independently derived dependency
  and failure-mode model plus seeded architectural hazards. Acceptable burden is
  one compact map and decision-relevant findings, within the common burden gate.
- **Overlap:** `review-code`, `security-privacy-review`, and
  `product-surface-review`; the single-lens boundary must outperform extracting
  the same lens from `review-code`.
- **Portfolio fields:** standalone boundary; explicit-only; contract-only;
  benchmark priority. Primary value is risk reduction; primary burden is expert
  review minutes, with context, tool calls, and false positives no worse.
- **Evidence / hypothesis:** the pinned dataset cases
  `service-boundary-review`, `current-state-health-review`, and
  `low-likelihood-destructive-migration` verify intended structure. No durable
  comparative result is linked, so the value mechanism remains a hypothesis.
- **Confirm or reverse:** confirm the standalone boundary with replicated wins on consequential
  migration/service-boundary cases and non-inferior concise results on bounded
  retain-as-is cases. Reverse to merge/retirement study if `review-code` or the
  terse baseline matches risk detection with lower burden.
- **Evaluation:** paired architecture decisions with hidden dependency/failure
  facts; deterministic graph/invariant oracle plus blinded review scored on
  detected dependency errors, unsafe migration decisions, and feasible rollback;
  sibling-boundary routing cases.

### 2. `compound-learning`

- **Outcome:** validated reusable learning changes future work without leaking
  secrets, preserving guesses, or writing without authority.
- **Unique value hypothesis:** the read/apply default, explicit capture authority,
  validation threshold, and store-selection rules will improve later task quality
  more than ad hoc memory or a terse “record the lesson” instruction.
- **Apply / bypass:** apply when prior lessons could materially affect work or when
  the user/repository explicitly requests capture; bypass ordinary completion
  where no reusable learning or write authority exists.
- **Contract:** input is a completed evidence source or a configured lesson store.
  Output is applied constraints or a small reusable note with provenance and
  store action. Oracle checks source fidelity, authorization, privacy, retrieval,
  and later-task reuse. Acceptable burden is a narrow lookup or one small note;
  no manufactured repository convention.
- **Overlap:** `setup-repo-context` locates conventions; `understand-change`
  teaches a person. Neither proves a lesson improves a future run.
- **Portfolio fields:** standalone boundary; explicit-only; contract-only;
  benchmark priority. Primary value is later-task risk reduction; primary burden
  is total capture-plus-retrieval time, with privacy, maintenance, and user
  interactions no worse.
- **Evidence / hypothesis:** cases `validated-solution-note` and
  `read-only-lesson-check` cover capture authorization and read-only use. No
  durable comparative or longitudinal reuse result is linked; contract value and
  future-use value remain unknown.
- **Confirm or reverse:** confirm explicit use only if captured lessons are later
  retrieved and prevent a seeded repeat failure without privacy or maintenance
  regressions. Reverse toward retirement if a terse evidence-backed note performs
  equally or retrieval burden exceeds later benefit.
- **Evaluation:** two-stage longitudinal seeded tasks (capture, then fresh-context
  reuse), authorization/bypass cases, secret-injection checks, and human review of
  whether reuse prevents the seeded repeat failure; note polish and format do not
  score.

### 3. `implement-change`

- **Outcome:** a requested production change is small, locally idiomatic,
  preserves user work, and carries evidence for its riskiest behavior.
- **Unique value hypothesis:** state/identity checkpoints, evidence amplification,
  and semantic scope-fit judgment will reduce consequential regressions without
  over-planning routine changes.
- **Apply / bypass:** apply to retained implementation, fixes, migrations, and
  cross-layer changes; bypass report-only review, pure research, and primary
  throw-away learning work.
- **Contract:** input is settled behavior, repository evidence, risk boundaries,
  and a verification seam. Output is the smallest retained diff plus focused
  verification and residual risk. Oracle is executable behavior, diff-scope
  reconciliation, preservation of pre-existing changes, and independent
  invariants for consequential paths. Routine work must not pay the stateful
  checkpoint cost.
- **Overlap:** `prototype` supplies subordinate disposable probes; `review-code`
  independently judges the resulting diff; `to-tickets` may supply program shape.
- **Portfolio fields:** standalone boundary; explicit-only; contract-only;
  benchmark priority. Primary value is executable task outcome and risk reduction;
  primary burden is human review minutes, with elapsed time, interactions, and
  tool calls no worse on routine cases.
- **Evidence / hypothesis:** cases `cross-stack-change`,
  `intent-kernel-prevents-overbuilding`, `stateful-integration-checkpoint`,
  `program-shape-readiness`, `mixed-diff-scope-fit`, and
  `backend-evidence-amplification` cover routine, stateful, scope, and
  evidence-amplification behavior. No durable comparative result is linked, so
  marginal value remains unknown.
- **Confirm or reverse:** confirm the standalone boundary if consequential cases show replicated
  defect prevention and routine cases remain non-inferior in burden. Reverse to a
  smaller checkpoint or retirement study if added process does not change the
  diff, verification, or risk outcome.
- **Evaluation:** executable seeded repositories with hidden state/race/scope
  hazards, exact diff/test oracles, protected unrelated changes, and separate
  routine typo/pattern cases that should bypass ceremony.

### 4. `product-surface-review`

- **Outcome:** a release owner gets a concise user-workflow verdict that catches
  reachable state, recovery, accessibility, trust, and consequential-mutation
  failures.
- **Unique value hypothesis:** tracing the journey and concentrating on informed
  intent, authoritative outcomes, and recovery will find product harm that a full
  code review or terse UX review misses.
- **Apply / bypass:** apply to a user-facing workflow or product artifact; bypass
  backend-only authorization and full-diff review.
- **Contract:** input is a supplied surface, user/job, business goal, and evidence
  boundary. Output is a release verdict with only decision-relevant findings.
  Oracle is a reachable state/task matrix, accessibility checks, and seeded
  trust/recovery failures. Burden must be lower than a full multi-lens review.
- **Overlap:** heavy overlap with `review-code`'s product lens and
  `security-privacy-review` on billing/admin/destructive flows.
- **Portfolio fields:** overlap boundary unresolved; explicit-only; contract-only;
  benchmark priority. Primary value is reachable product-harm reduction; primary
  burden is expert review minutes, with false positives, context, and elapsed time
  no worse than the comparison route.
- **Evidence / hypothesis:** case `billing-settings-flow` defines a plausible
  trust and recovery oracle, but no durable comparison establishes value against
  either a terse baseline or `review-code`. The high overlap leaves even the
  structural role unresolved.
- **Confirm or reverse:** confirm a standalone boundary with either replicated
  discovery of material product harm missed by comparison arms, or non-inferior
  harm detection with materially better routing precision, false-positive rate,
  or review burden. Move to merge/retirement study if neither advantage holds.
- **Evaluation:** rescue test on representative workflows with hidden but
  reachable state/trust defects, instrumented task completion and accessibility
  oracles, plus direct union comparison against `review-code`'s product lens.

### 5. `prototype`

- **Outcome:** an uncertain product or technical decision gains concrete
  observation quickly without turning disposable work into a production
  commitment.
- **Unique value hypothesis:** the fidelity gate, build-evidence versus
  decision-evidence boundary, and independent-oracle requirement will prevent
  premature hardening and false “proved” claims.
- **Apply / bypass:** apply when seeing, exercising, or measuring an artifact is
  necessary; bypass when existing evidence or prose can decide, or when retained
  production change is the primary outcome.
- **Contract:** input is one falsifiable learning question and safe proving
  ground. Output is the smallest sufficient observation, learned constraint,
  discard boundary, and next decision. Oracle is the named falsifier, trace,
  interaction task, or independent calculation. Acceptable burden is the lowest
  fidelity that can discriminate; polish and production rollout are excluded.
- **Overlap:** `implement-change` may use disposable verification; `scope-work`
  frames uncertainty; `to-spec` follows only after direction is chosen.
- **Portfolio fields:** standalone boundary; explicit-only; contract-only;
  benchmark priority. Primary value is decision information gained; primary
  burden is elapsed time to decision, with retained-file leakage, tool calls, and
  expert review no worse.
- **Evidence / hypothesis:** cases `disposable-ui-flow`,
  `inconclusive-scratch-demo`, `implicit-high-fidelity-ui`,
  `implicit-logic-state-model`, and `alongside-backend-verification` expose UI,
  state-model, scratch, and verification task shapes. No durable comparison
  establishes which shapes gain value from the skill.
- **Confirm or reverse:** confirm explicit use when the artifact changes a
  decision or falsifies a material assumption faster than inspection, while
  bypass cases remain artifact-free. Reverse toward narrower subtypes or merge
  into implementation if standalone prototypes do not change decisions.
- **Evaluation:** UI interaction, state-model, and integration-feasibility
  families with predeclared observations; negative prose-sufficient cases; score
  whether a hidden decision-relevant assumption was falsified or a predeclared
  decision changed, plus false proof claims, retained-file leakage, and effort.

### 6. `research-brief`

- **Outcome:** a decision receives current, source-backed evidence with calibrated
  confidence and explicit limits before option selection.
- **Unique value hypothesis:** evidence-type separation, freshness checks, and a
  handoff sufficiency gate will reduce unsupported current-fact claims and
  premature recommendations.
- **Apply / bypass:** apply when external facts are current, contested, or
  decision-critical; bypass when evidence is already sufficient and the user
  primarily needs options, or when the task is local implementation.
- **Contract:** input is a decision, audience, horizon, confidence need, and local
  constraints. Output is an evidence conclusion with primary-source links,
  dates, uncertainty, and handoff condition. Oracle checks source freshness,
  claim entailment, counterevidence, and citation correctness. Burden scales to
  risk and omits option-scoring ceremony.
- **Overlap:** `strategy-to-options` owns the choice; `scope-work` owns an unstable
  frame. Research may feed either but should not silently become them.
- **Portfolio fields:** standalone boundary; explicit-only; contract-only;
  benchmark priority. Primary value is factual task outcome; primary burden is
  elapsed time to decision-ready evidence, with source count, interactions, and
  review effort no worse.
- **Evidence / hypothesis:** cases `fast-moving-vendor-choice` and
  `weak-evidence-warning` cover fast-moving and weak-evidence decisions. No
  durable comparative result is linked; marginal value is unknown.
- **Confirm or reverse:** confirm the standalone boundary if it reduces false/stale claims and
  improves evidence completeness on fast-moving cases without delaying bounded
  primary-source checks. Reverse to terse research instructions if source quality
  and decisions are non-inferior at lower burden.
- **Evaluation:** time-stamped vendor/API/regulatory questions with a frozen
  primary-source answer set, deliberate testimonial/vendor-framed distractors,
  citation-entailment grading, and settled-evidence bypass cases.

### 7. `review-code`

- **Outcome:** a release decision surfaces reachable defects, missing critical
  validation, and material risk before summaries or style commentary.
- **Unique value hypothesis:** independent multi-lens aggregation plus explicit
  state/temporal reconstruction will catch high-consequence and cross-path
  regressions that a terse review misses, while deduplication limits noise.
- **Apply / bypass:** apply to a concrete diff requiring full release-safety
  judgment; bypass single-lens architecture, product, or security questions and
  explanation-only requests.
- **Contract:** input is a resolved diff, intent, standards, and relevant
  surrounding behavior. Output is a verdict and evidence-backed findings ordered
  by release consequence. Oracle is executable reproduction, seeded defect set,
  independent invariant model, and calibrated false-positive review. Burden is
  justified only by additional valid findings or risk confidence.
- **Overlap:** umbrella for the three specialist reviews; direct comparison must
  test whether specialist depth or full-lens aggregation adds unique findings.
- **Portfolio fields:** umbrella boundary; explicit-only;
  contract-only; benchmark priority. Primary value is missed-defect reduction;
  primary burden is adjudicator review minutes, with false positives, context,
  and tool calls no worse.
- **Evidence / hypothesis:** cases `permission-regression`,
  `no-actionable-findings`, `executable-proof-for-release-finding`,
  `release-disposition-tail-risk`, `release-disposition-recoverable-edge`, and
  `stateful-cross-path-regression` cover authorization, executable proof, tail
  risk, recoverable UI, and stateful paths. No durable comparative result is
  linked; value is unproven despite a plausible high-consequence mechanism.
- **Confirm or reverse:** confirm the umbrella boundary only with replicated additional valid
  findings or fewer missed material defects on consequential diffs and no
  manufactured findings on clean/routine diffs. Reverse to specialist composition
  or a terse review if outcome is non-inferior with less context and review cost.
- **Evaluation:** blinded seeded PRs with complete defect oracles, clean controls,
  temporal/concurrency cases, human false-positive adjudication, and specialist
  versus full-review union comparisons.

### 8. `route-work`

- **Outcome:** uncertain work takes the smallest sufficient capability path and
  already-bounded work proceeds directly without routing ceremony.
- **Unique value hypothesis:** explicit readiness, fidelity, and bypass judgment
  will improve use/bypass selection across skills and external capabilities.
- **Apply / bypass:** apply when routing is requested or genuinely ambiguous;
  bypass when next action and verification are obvious.
- **Contract:** input is desired outcome, readiness, risk, and available
  capabilities. Output is either direct downstream work or a concise route and
  handoff. Oracle is a predeclared expert route set with acceptable alternatives,
  correct bypass, and downstream completion. Extra router-only prose on direct
  cases is a burden failure.
- **Overlap:** touches every skill but owns none of their work products. Its value
  is selection, not a forced execution result.
- **Portfolio fields:** standalone boundary; explicit-only; contract-only;
  benchmark priority. Primary value is routing quality; primary burden is added
  user interactions, with router-only output, elapsed time, and downstream task
  outcome no worse.
- **Evidence / hypothesis:** cases `ambiguous-routing`, `route-and-continue`,
  `learning-not-review`, `raise-fidelity-to-prototype`, and
  `keep-settled-contract-in-spec` encode ambiguous, continue, learning,
  prototype-fidelity, and spec routes. Real autonomous routing and marginal
  selection value remain untested.
- **Confirm or reverse:** confirm explicit use with high obvious-use,
  clear-bypass, sibling-boundary, and ambiguous-route accuracy plus non-inferior
  downstream results. Retire as a selectable skill if base routing matches it or
  if explicit invocation is the only condition under which it routes correctly.
- **Evaluation:** selection-only suite scored separately from downstream output;
  include obvious-use, clear-bypass, multi-capability, and out-of-portfolio cases,
  followed by end-to-end completion checks for selected routes.

### 9. `scope-work`

- **Outcome:** ambiguous consequential work becomes a bounded decision frame with
  users, success, constraints, risks, assumptions, and a reversible next move.
- **Unique value hypothesis:** a bounded pressure test and explicit separation of
  user-owned decisions from safe assumptions will prevent premature execution.
- **Apply / bypass:** apply when goals, stakeholders, constraints, or consequence
  could change the path; bypass settled low-risk work and framed decisions that
  already need options.
- **Contract:** input is an ambiguous request plus relevant local evidence. Output
  is a compact scope snapshot and next move, not a long interview. Oracle is a
  hidden decision-fact set and scoring of missing decision-changing constraints,
  unnecessary questions, and safe assumptions.
- **Overlap:** the stopping point is exactly `strategy-to-options`'s starting
  point; both repeat decision, horizon, evidence, risk, and pressure-test fields.
- **Portfolio fields:** adjacent handoff boundary with `strategy-to-options`;
  explicit-only; contract-only; merge study. Primary value is decision-frame
  completeness; primary burden is unnecessary user questions, with constraint
  recall, elapsed time, and review effort no worse.
- **Evidence / hypothesis:** case `ambiguous-platform-decision` defines the
  intended frame, but no durable comparison establishes standalone or merged
  value.
- **Confirm or reverse:** advance the merge study if one adaptive decision
  skill preserves scoping recall and option quality while eliminating a full
  handoff and keeping every other burden metric no worse. Keep separate only if
  the readiness boundary materially improves routing or prevents premature
  options.
- **Evaluation:** ambiguous-to-framed and already-framed task pairs; compare
  separate skills, merged projection, and terse baseline using constraint recall,
  question cost, option readiness, and routing accuracy.

### 10. `security-privacy-review`

- **Outcome:** a trust-boundary decision catches reachable authorization,
  sensitive-data, abuse, integration, billing, or admin harm with a credible
  mitigation and verification signal.
- **Unique value hypothesis:** asset/actor/boundary mapping, backend enforcement,
  data minimization, and tail-risk disposition will reduce missed high-consequence
  failures beyond a general review.
- **Apply / bypass:** apply to a security/privacy-heavy code, design, API, or
  product question; bypass a full multi-lens diff when security is only one lens.
- **Contract:** input is the bounded surface and threat/data context. Output is a
  verdict and evidence-backed boundary findings. Oracle is a seeded threat model,
  executable permission/abuse checks, and calibrated false-positive review.
  Burden is limited to decision-changing boundaries and controls.
- **Overlap:** `review-code` includes a security lens; `product-surface-review`
  overlaps on billing/admin trust; `architecture-review` overlaps on system
  boundaries.
- **Portfolio fields:** overlap boundary; explicit-only; contract-only; benchmark
  priority. Primary value is high-consequence risk reduction; primary burden is
  expert adjudication minutes, with false positives, context, and tool calls no
  worse.
- **Evidence / hypothesis:** cases `admin-api-boundary` and
  `low-likelihood-incorrect-charge` cover admin authorization and duplicate
  charging. No durable comparison establishes marginal value or regression.
- **Confirm or reverse:** confirm a standalone specialist boundary through either
  repeatedly unique valid high-consequence findings, or non-inferior risk
  coverage with materially better routing precision, false-positive rate, or
  expert burden. Merge into `review-code` if neither advantage holds.
- **Evaluation:** vulnerable and safe paired fixtures across authorization,
  privacy, webhook, billing, and admin boundaries; executable exploit/control
  oracle plus independent severity and false-positive adjudication.

### 11. `setup-repo-context`

- **Outcome:** an agent gets an accurate, small snapshot of repository conventions
  without invented tooling, paths, or unauthorized maintenance.
- **Unique value hypothesis:** explicit/inferred/unknown labels and write-mode
  authorization will improve onboarding accuracy and reduce rediscovery.
- **Apply / bypass:** apply to explicit onboarding or context-refresh requests;
  bypass ordinary repository work where nearest instructions and manifests are
  already sufficient.
- **Contract:** input is requested convention fields and repository evidence.
  Output is a cited snapshot or narrowly authorized update. Oracle checks factual
  path/command/status accuracy, invented conventions, write authorization, later
  task reuse, and discovery burden.
- **Overlap:** much of read mode duplicates base repository inspection and
  `compound-learning` store discovery; write mode creates maintenance risk.
- **Portfolio fields:** overlap boundary unresolved; explicit-only; contract-only;
  benchmark priority. Primary value is factual accuracy and later-task reuse;
  primary burden is follow-on discovery time, with maintenance, interactions, and
  context no worse.
- **Evidence / hypothesis:** cases `evidence-backed-context` and
  `read-only-context-discovery` define write-authorized and read-only behavior.
  No durable comparison measures factual improvement or later-task discovery
  cost, so overlap with base inspection leaves the structural role unresolved.
- **Confirm or reverse:** confirm a standalone boundary only if representative onboarding
  tasks show fewer factual errors or materially lower later-task discovery cost.
  Move to retirement study if direct inspection remains non-inferior.
- **Evaluation:** fresh-repository convention extraction with a deterministic
  source-of-truth oracle, documented-but-absent traps, tracker/tool ambiguity,
  unauthorized-write cases, and a follow-on implementation measuring whether the
  snapshot reduces correct-work cost.

### 12. `strategy-to-options`

- **Outcome:** a framed, evidenced decision becomes two to four real paths with
  tradeoffs, selection conditions, recommendation, and revisit evidence.
- **Unique value hypothesis:** evidence readiness, symmetric option dimensions,
  no-build/defer consideration, and “choose this when” rules will improve
  decision quality over generic brainstorming.
- **Apply / bypass:** apply only after the problem is framed and decision-critical
  evidence is sufficient; bypass unframed work and current-fact research gaps.
- **Contract:** input is decision frame, evidence, constraints, horizon, and
  stakeholders. Output is decision-ready options and a bounded recommendation,
  not execution. Oracle checks feasibility, coverage of real alternatives,
  evidence consistency, dominance errors, and decision-maker usefulness.
- **Overlap:** shares the decision frame and pressure test with `scope-work`; its
  output may feed `prototype` or `to-spec`.
- **Portfolio fields:** adjacent handoff boundary with `scope-work`; explicit-only;
  contract-only; merge study. Primary value is feasible decision-option quality;
  primary burden is decision-maker review minutes, with handoffs, context, and
  interactions no worse.
- **Evidence / hypothesis:** case `build-buy-defer` defines option behavior. No
  durable comparison establishes standalone or merged value.
- **Confirm or reverse:** confirm merge candidacy under the same union test as
  `scope-work`: non-inferior frame and options while eliminating a full handoff
  and keeping other burden metrics no worse. Preserve separation only if a
  measurable readiness gate prevents unsupported option generation.
- **Evaluation:** framed build/buy/defer decisions with hidden feasibility and
  evidence constraints, plus unframed and research-missing boundary cases;
  independent review scored on feasible nondominated coverage and correct
  choose-when decisions, plus deterministic dominated-option checks.

### 13. `to-spec`

- **Outcome:** a chosen direction becomes a lightweight external behavior and
  delivery contract without reopening the decision or prescribing brittle file
  mechanics.
- **Unique value hypothesis:** the readiness gate, accepted/proposed/open decision
  separation, validation seams, and compact decision handoff will prevent spec
  drift and downstream re-litigation.
- **Apply / bypass:** apply when direction is chosen and behavior/contracts need
  durable definition; bypass unstable frames and requests that only need delivery
  slices from an adequate existing spec.
- **Contract:** input is the settled decision and supporting artifacts. Output is
  goals, non-goals, constraints, external contract, rollout, validation, open
  questions, and decision handoff. Oracle checks decision fidelity, behavioral
  completeness, testability, and absence of invented implementation detail.
- **Overlap:** `to-tickets` consumes the same accepted decisions and repeats local
  context, risk, release, verification, and handoff work.
- **Portfolio fields:** adjacent handoff boundary with `to-tickets`; explicit-only;
  contract-only; merge study. Primary value is decision and external-contract
  fidelity; primary burden is downstream clarification count, with context,
  handoffs, and expert review no worse.
- **Evidence / hypothesis:** case `prototype-to-spec` defines the current
  decision-handoff behavior. No durable comparison evaluates it.
- **Confirm or reverse:** advance the merge study if one
  contract-to-delivery skill preserves spec quality and ticket independence while
  eliminating one full handoff and keeping other burden metrics no worse. Keep
  separate if durable spec reuse across releases or teams is measurably better.
- **Evaluation:** settled-direction fixtures with hidden accepted decisions and
  edge states; score external-contract completeness, decision preservation,
  implementation leakage, later ticket quality, and separate versus merged burden.

### 14. `to-tickets`

- **Outcome:** a settled plan becomes independently reviewable and releasable
  outcome contracts with correct blockers, compatibility sequence, verification,
  and rollback boundaries.
- **Unique value hypothesis:** tracer-bullet slicing, dependency-frontier
  reasoning, expand-contract sequencing, and outcome-focused issue projection
  will reduce unsafe layer tickets and hidden handoff assumptions.
- **Apply / bypass:** apply when work needs tickets, tracker-ready issues, release
  sequencing, or migration slices; bypass ambiguous framing and work that is
  safely one obvious direct change unless a ticket itself is requested.
- **Contract:** input is a spec, plan, or settled conversation with accepted and
  open decisions. Output is the smallest useful ticket set in blocker order.
  Oracle checks behavior coverage, dependency DAG, independent review/release,
  accepted-decision preservation, implementation leakage, and rollout safety.
- **Overlap:** `to-spec` owns the preceding behavior contract; `implement-change`
  confirms program shape against code before editing.
- **Portfolio fields:** adjacent handoff boundary with `to-spec`; explicit-only;
  contract-only; merge study. Primary value is dependency and release correctness;
  primary burden is ticket-set review minutes, with context, handoffs, and
  downstream clarification no worse.
- **Evidence / hypothesis:** cases `migration-slicing`,
  `program-shape-before-slicing`, `routine-work-skips-program-shape`, and
  `issue-keeps-outcome-not-implementation` cover migrations, program shape,
  routine work, and outcome-focused issues. No durable comparison evaluates
  current marginal value.
- **Confirm or reverse:** use the same union test as `to-spec`. Keep standalone
  only if it improves dependency/release correctness after controlling for the
  quality of the source spec; reverse to terse slicing if no unique delivery
  errors are prevented.
- **Evaluation:** seeded migrations, routine one-ticket work, consequential
  orchestration, and tracker-projection fixtures with deterministic dependency
  and behavior-coverage oracles; compare separate, merged, and terse arms.

### 15. `understand-change`

- **Outcome:** a learner gains a causal mental model sufficient for later
  participation without confusing explanation with code-review approval.
- **Unique value hypothesis:** learner-goal calibration, one end-to-end causal
  trace, lightest-medium selection, and an honest comprehension gate will improve
  transfer while avoiding unnecessary artifacts.
- **Apply / bypass:** apply to explicit teaching, mental-model restoration, or
  preparation to extend a change; bypass defect review and simple explanation
  requests that base chat can answer proportionately.
- **Contract:** input is a resolved change, learner profile, and participation
  goal. Output is a proportionate causal explanation or explicitly requested
  disposable artifact. Oracle is learner transfer on novel questions/tasks,
  source-claim accuracy, medium cost, and artifact safety—not output structure or
  self-reported clarity.
- **Overlap:** `review-code` judges correctness; `compound-learning` preserves a
  reusable organizational lesson; neither proves learner understanding.
- **Portfolio fields:** standalone boundary; explicit-only; contract-only;
  benchmark priority. Primary value is learner transfer; primary burden is time
  to successful transfer, with artifact creation, review effort, and factual
  errors no worse.
- **Evidence / hypothesis:** cases `state-machine-html-learning-path`,
  `small-change-uses-chat`, and `cross-layer-adaptive-medium` cover small chat,
  cross-layer, and interactive state-machine teaching. No durable learner-transfer
  or comparative result is linked; current human-learning value remains
  unvalidated.
- **Confirm or reverse:** confirm explicit use only if learners perform better on
  transfer questions or a later modification and medium selection stays
  proportionate. Narrow or retire artifact-heavy branches if structured chat is
  non-inferior with lower creation and review burden.
- **Evaluation:** blinded learner transfer study across small, cross-layer, and
  stateful changes; factual source oracle; delayed modification task; chat versus
  structured/HTML medium ablation; artifact safety and time-cost checks.

## Unknown Register

| ID | Material unknown | Why it can change issue #4 | Smallest resolving validation |
| --- | --- | --- | --- |
| U1 | Exact model, reasoning mode/effort, harness revision, skill/prompt/fixture hashes, and workspace identity are absent from ignored local historical results | Without attribution, those observations cannot be assigned to current skills or GPT-5.6 | Preserve these identities in one immutable dry-run manifest before designing behavioral cases |
| U2 | Historical result files are ignored local artifacts, not durable review evidence | Results cannot be independently reviewed from a clone and may be lost | Complete issue #2's versioned redacted artifact layout before admitting any historical or future live result as disposition evidence |
| U3 | The current revision identity may differ from any ignored historical run's skill, case, and fixture inputs | A result may test obsolete behavior or omit the current contract | Freeze the current repository revision and map every benchmark case to exact skill/case/fixture hashes |
| U4 | Existing comparisons use an explicit no-skill prompt, and current fixtures do not label which requirements originate with the user/repository versus the skill | They do not isolate marginal value and could leak treatment decisions into the terse arm | For each selected issue #4 case, record requirement provenance and add a terse baseline that preserves only fixture-, user-, and repository-supplied requirements |
| U5 | Current cases are predominantly contract-derived and lack representative provenance and independent outcome oracles | A skill can pass by imitating its own format while adding no engineering value | For each skill, retain contract cases separately and add at least one pinned representative positive-use and one bypass/boundary case with an independent oracle |
| U6 | Real routing accuracy is unknown; current lexical routing is explicitly non-blocking and not the agent's real selector | Misrouting can erase forced-use value or impose ceremony on routine tasks | Run a selection-only suite across obvious-use, clear-bypass, sibling-boundary, ambiguous, and out-of-portfolio tasks |
| U7 | Human review effort, user interactions, retry/failure burden, and reliable token aggregation are incomplete | Apparent quality gains may cost more attention than they save | Persist per-arm telemetry plus independent-review time/disagreement; record unavailable fields as `unknown` |
| U8 | Merge hypotheses have no union-versus-separate evidence | A merge could reduce routing burden or destroy a useful readiness/handoff boundary | Compare separate skills, one merged compact projection, and the terse baseline on the same cases; predeclare one primary burden metric and no-worse guardrails rather than a scalar burden threshold |
| U9 | `compound-learning` and `understand-change` lack longitudinal or learner-transfer outcomes | Their intended benefit occurs after the immediate artifact, where current judges do not look | Add a fresh-context reuse task and a delayed learner transfer/modification task |
| U10 | No current skill has both replicated marginal-value evidence and real use/bypass evidence | Default eligibility would be a claim beyond reviewed evidence | Complete issue #4's representative benchmark, then issue #5's frozen repeated baseline before any default decision |

## Evidence links

- Portfolio outcome and acceptance boundary: [issue #3](https://github.com/daikeren/skills/issues/3)
- Required evaluation workflow and current harness gaps: [issue #2](https://github.com/daikeren/skills/issues/2)
- Representative benchmark dependency: [issue #4](https://github.com/daikeren/skills/issues/4)
- Frozen baseline dependency: [issue #5](https://github.com/daikeren/skills/issues/5)
- Final disposition dependency: [issue #6](https://github.com/daikeren/skills/issues/6)
- Current harness boundary and generated-result policy: [README validation and evals](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/README.md#validation)
- Cross-skill product, architecture, security, operations, cost, and team-speed dimensions: [shared rubric](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/references/product-architecture-security-rubric.md)
- Evidence types and confidence boundary: [evidence rubric](https://github.com/daikeren/skills/blob/99e01a1a59ee5f3db65aabea0f52684a922c75ac/references/evidence-rubric.md)
- Outcome-focused, lean prompt constraint: [OpenAI GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model)

This review changes no skill behavior, evaluation pipeline, or downstream issue
state. It is the value-hypothesis input for issue #4, not its implementation.
