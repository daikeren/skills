#!/usr/bin/env node

const crypto = require("crypto");
const path = require("path");
const {
  ARTIFACT_SCHEMA_VERSION,
  QUALITY_DIMENSIONS,
  persistRunWorkspace,
  promptArmIdentity,
  sha256,
  surfaceAnomalies
} = require("./eval-workspace");
const { aggregateResults } = require("./run-live-evals");

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[^0-9a-z]/gi, "").toLowerCase();
const runId = `sample-redacted-${stamp}-${crypto.randomBytes(3).toString("hex")}`;
const target = process.env.SAMPLE_EVAL_OUTPUT_DIR
  ? path.resolve(root, process.env.SAMPLE_EVAL_OUTPUT_DIR)
  : path.join(root, "evals", "results", "runs", runId);
const candidateIdentity = {
  id: "candidate-sample-v1",
  kind: "bounded-ablation",
  skill: { algorithm: "sha256", digest: sha256("sample candidate"), files: [] },
  hypothesis: "A focused instruction change improves risk detection without adding avoidable burden.",
  ablation: { id: "sample-ablation-v1", change: "Synthetic offline example only.", maximumAlternateCandidates: 1 }
};
const baselineIdentity = promptArmIdentity("terse");
const dimensions = [
  { id: "applicability", winner: "tie", reason: "Both stayed proportionate." },
  { id: "task-success", winner: "candidate", reason: "The candidate included the required result." },
  { id: "missed-risks", winner: "candidate", reason: "The candidate identified the supplied boundary." },
  { id: "unnecessary-steps", winner: "tie", reason: "Neither added unnecessary process." },
  { id: "tool-calls", winner: "review", reason: "Offline sample telemetry is unavailable." },
  { id: "elapsed-time", winner: "tie", reason: "Synthetic times are equal." },
  { id: "output-burden", winner: "tie", reason: "Outputs are similarly bounded." }
];
const results = [1, 2].map((trial) => ({
  skill: "sample-skill",
  id: "offline-case",
  trial,
  trialCount: 2,
  status: "completed",
  judgmentStatus: "pass",
  armIdentities: { candidate: candidateIdentity, baseline: baselineIdentity },
  measurements: {
    durationMs: 10,
    outputBytes: 48,
    rawOutputBytes: 48,
    toolCalls: null,
    toolCallBreakdown: null,
    tokens: null,
    artifactCount: 1,
    artifactBytes: 38
  },
  checks: [{ id: "case-1", expectation: "Names the supplied boundary.", status: "pass", evidence: ["sample boundary"] }],
  comparison: {
    enabled: true,
    status: "completed",
    skillValue: "improved",
    summary: "Synthetic candidate advantage for artifact-shape demonstration only.",
    dimensions,
    generationOrder: trial % 2 === 1 ? ["candidate", "baseline"] : ["baseline", "candidate"],
    presentationOrder: trial % 2 === 1
      ? { A: "candidate", B: "baseline" }
      : { A: "baseline", B: "candidate" },
    judge: { status: "offline-synthetic" },
    baseline: {
      status: "completed",
      judgmentStatus: "fail",
      judge: { status: "offline-synthetic" },
      measurements: {
        durationMs: 10,
        outputBytes: 30,
        rawOutputBytes: 30,
        toolCalls: null,
        toolCallBreakdown: null,
        tokens: null,
        artifactCount: 0,
        artifactBytes: 0
      },
      checks: [{ id: "case-1", expectation: "Names the supplied boundary.", status: "fail", evidence: [] }]
    }
  },
  retainedEvidence: {
    candidate: {
      output: [
        "Offline sample boundary. API_TOKEN=sample-sensitive-value",
        '{"credentials":"sample-json-credential"}',
        "password: |\n  sample yaml block credential"
      ].join("\n"),
      artifacts: [{ path: "sample-report.txt", size: 38, sha256: sha256("sample report"), content: "sample report; API_TOKEN=artifact-value" }],
      executionTrace: []
    },
    baseline: { output: "Offline baseline response.", artifacts: [], executionTrace: [] }
  }
}));
const run = {
  schemaVersion: ARTIFACT_SCHEMA_VERSION,
  runId,
  generatedAt: new Date().toISOString(),
  qualityTarget: "Repeatable net behavioral improvement over an appropriate baseline on the tested task distribution after accounting for quality, risk, and burden.",
  reportedDimensions: QUALITY_DIMENSIONS,
  hypothesis: candidateIdentity.hypothesis,
  comparisonEnabled: true,
  primaryBaseline: "terse",
  selectedCases: [{
    id: "sample-skill/offline-case",
    datasetVersion: 1,
    datasetSha256: sha256("offline sample dataset"),
    definitionSha256: sha256("offline sample case"),
    fixtureRevision: [{ path: "synthetic-inline", sha256: sha256("sample fixture") }],
    oracleRevision: { path: "synthetic-offline-oracle", sha256: sha256("sample oracle") }
  }],
  taskDistribution: { description: "Synthetic offline artifact demonstration only", caseCount: 1 },
  identities: {
    harness: {
      packageVersion: "sample",
      repositoryRevision: "offline",
      sourceSha256: sha256("sample harness"),
      benchmarkPolicy: {
        id: "synthetic-offline-benchmark",
        version: "sample-1",
        status: "draft",
        sha256: sha256("sample benchmark policy"),
        selectedEntries: [{
          id: "sample-skill/offline-case",
          readiness: "ready",
          oracle: "synthetic-offline-oracle",
          sha256: sha256("sample benchmark entry")
        }]
      }
    },
    model: { agent: "offline-fixture", id: "sample-model", configuration: { execution: "none" } },
    candidate: candidateIdentity,
    baseline: baselineIdentity
  },
  repeats: 2,
  trialCount: 2,
  concurrency: 1,
  durationMs: 20,
  claimCalibration: {
    eligibleForComparativeClaim: false,
    status: "ineligible",
    scope: "Artifact-shape and redaction demonstration only.",
    materialUncertainty: ["No model was called, so this artifact contains no behavioral evidence."]
  },
  aggregates: aggregateResults(results, true),
  anomalies: surfaceAnomalies(results),
  results
};

persistRunWorkspace(run, target);
console.log(path.relative(root, target));
