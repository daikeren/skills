# Comparative evaluation workspace

This workspace tests one operational quality target: on the named task
distribution, a candidate should produce repeatable net behavioral improvement
over an appropriate baseline after accounting for task success, missed risk,
unnecessary work, and available execution-cost signals. Following a skill's own
process is not sufficient evidence that it is better.

Live evaluation remains opt-in. `npm run validate` checks the deterministic
schema, artifact, baseline-selection, aggregation, redaction, cleanup, and
benchmark-policy contracts without calling a model.

## Reported dimensions

Every comparative run reports these dimensions separately:

- `contract-compliance`: whether the candidate met its declared behavioral
  checks. This does not prove outcome improvement.
- `applicability`: whether the candidate used or bypassed extra process in
  proportion to the task. This does not replace `npm run diagnose:routing`.
- `outcome-quality`: comparative task success.
- `risk-detection`: comparative material-risk coverage.
- `execution-burden`: unnecessary steps, observable tool calls, elapsed time,
  token usage when available, and output size.

Cases may declare `use`, `bypass`, or `avoid-extra-process` applicability.
Unavailable telemetry is recorded as `unknown`; the harness does not estimate
provider data it cannot observe.

## Benchmark policy and retained calibration case

`evals/benchmark/manifest.json` is a draft inventory, not a frozen portfolio
benchmark. A frozen manifest must classify every current case, contain no
planned entries, and include at least one positive and one negative or bypass
case per skill.

Only the matched `review-code/deployment-policy-bypass` and
`review-code/deployment-policy-bound` pair is currently marked ready. Both arms
receive the same neutral task and bounded workspace; only the neutrally named
handler implementation differs. Judge-only oracles score the reachable policy
bypass or clean control rather than exact wording or formatting. This pair is a
bounded calibration case and does not support portfolio or transfer claims.

Ready cases record source identity, license, fixture revision, contamination
risk, intended task distribution, and an independent oracle under
`evals/oracles/`. Candidate and baseline workspaces exclude evaluator-owned
definitions, runners, validators, tests, results, and unrelated fixtures.
Immediately before each arm starts, the harness scans the final prompt and the
exact materialized workspace for protected oracle conclusions. This is a
bounded guard, not proof that all semantic contamination is impossible.

## Prompt arms

`LIVE_EVAL_COMPARE_BASELINE=1` enables one primary comparison arm. One baseline
per run keeps the causal question explicit and bounds cost.

- `terse` is the primary baseline. Its frozen `terse-v1` instruction is
  `Complete the task and return the work product.` Both arms still receive the
  same task, fixture, workspace-safety, and artifact boundaries.
- `previous-skill` compares against a snapshotted skill directory. Set
  `LIVE_EVAL_PREVIOUS_SKILL_DIR` and optionally
  `LIVE_EVAL_PREVIOUS_SKILL_ID`.
- `no-instruction` removes both the skill and terse instruction. Use it only
  when that distinct causal contrast is useful.

Select the arm with `LIVE_EVAL_BASELINE=terse`, `previous-skill`, or
`no-instruction`.

One run may test at most one candidate ablation. Point
`LIVE_EVAL_CANDIDATE_SKILL_DIR` at the alternate candidate and supply:

```text
LIVE_EVAL_ABLATION_ID=prune-suspected-no-op
LIVE_EVAL_ABLATION_CHANGE="Remove one instruction that appears to add ceremony."
LIVE_EVAL_HYPOTHESIS="Task success and risk coverage stay equal while burden falls."
```

The harness judges observable behavior and burden, not the textual property
itself. Candidate ablations and previous-skill baselines are limited to selected
cases from one skill.

## Exact run identity and bounded claims

For a claim-ready run, name the selected cases or task distribution and supply
the exact model identity and configuration:

```bash
LIVE_EVAL_AGENT=codex \
LIVE_EVAL_MODEL=gpt-5.6-sol \
LIVE_EVAL_MODEL_CONFIG='{"reasoning_effort":"high"}' \
LIVE_EVAL_TASK_DISTRIBUTION="Deployment policy review pair, revision 1" \
LIVE_EVAL_CASES=review-code/deployment-policy-bypass,review-code/deployment-policy-bound \
LIVE_EVAL_COMPARE_BASELINE=1 \
LIVE_EVAL_REPEATS=3 \
npm run eval:live
```

The run manifest records the run ID, package and repository revision, harness
and benchmark-policy hashes, candidate and prompt-arm hashes, case, fixture and
oracle revisions, model configuration, command identities and executable
hashes, trial count, and material uncertainty. Each trial copies from frozen
execution and skill-arm snapshots. Executables are hashed before use and
checked again at exit.

Claim eligibility requires known model/configuration identity, a ready policy
entry and oracle for every selected case, stable execution identities, and
complete candidate, baseline, contract-judge, and comparison-judge evidence.
Unknown, redacted, incomplete, or unstable identities remain reviewable but
make a comparative claim ineligible.

Claims are bounded to the recorded cases, model and configuration, harness,
prompt arms, fixtures, and sample size. Model-judged grades are diagnostics,
not deterministic proof. With fewer than three observations, aggregates retain
raw counts and values and mark variance statistics `insufficient-sample`.

## Versioned run artifacts

Each run receives an immutable ID and directory:

```text
evals/results/runs/<run-id>/
├── manifest.json
├── benchmark.json
├── independent-review.json
└── cases/<skill>/<case>/trial-<NNN>/
    ├── candidate/evidence.json
    ├── <baseline-id>/evidence.json
    └── judgment.json
```

`evals/results/**` is intentionally ignored. Generated evidence is not committed
by default; publishing or retaining a run in version control requires a separate
evidence-review decision. This repository change retains the pipeline, final
skill, and final calibration case, not historical run bundles.

Per-arm evidence contains bounded redacted output, safe text artifact copies or
binary metadata, attempted command identity and error, measurements, assertion
grades, and an available bounded execution trace. Credential forms in structured
values, JSON/YAML text, headers, URLs, environment assignments, and temporary
paths are redacted before persistence. Redaction is defense in depth, not a
guarantee that arbitrary sensitive prose is safe to publish.

Built-in Codex arms use private per-process permission profiles bound to the
materialized task workspace and deny sandboxed tool network access. The runner
removes source-checkout and `LIVE_EVAL_*` environment pointers. Custom and
non-Codex adapters remain `unknown` unless they supply independently verified
isolation evidence.

`benchmark.json` keeps the five quality dimensions distinct, aggregates
duration and token counts with candidate-baseline deltas, and surfaces:

- assertions that always pass in both arms;
- assertions that always fail in both arms;
- checks that vary across repeats;
- checks unverifiable from retained evidence; and
- material duration or token outliers when enough observations exist.

`independent-review.json` starts with one pending entry per case and trial plus
a pending claim assessment. A reviewer records evidence-linked approvals,
rejections, feedback, and disagreements after execution; the operator does not
label trials while they run. Run
`npm run eval:verify-review -- <run-directory>` before citing a behavioral
claim.

Generate a safe artifact-shape example without invoking a model:

```bash
npm run eval:sample
```

The generated manifest explicitly states that the sample is not behavioral
evidence.

## Iteration loop

1. State one behavioral hypothesis and intended task distribution.
2. Freeze the terse baseline or snapshot the previous skill version.
3. Run matched, isolated, repeated trials with exact identities.
4. Grade retained evidence across the distinct quality dimensions.
5. Complete independent review and inspect anomalies and traces.
6. Revise one bounded candidate hypothesis.
7. Rerun under a new immutable run ID and compare artifacts.
8. Calibrate the conclusion to the tested distribution, model, harness, arms,
   fixtures, trial count, and remaining uncertainty.

Do not change a skill merely because it is shorter or more conformant to an
authoring style. Revise it only when the measured behavioral trade-off supports
the change.
