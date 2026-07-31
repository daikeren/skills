#!/usr/bin/env node

const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  ARTIFACT_SCHEMA_VERSION,
  FROZEN_TERSE_INSTRUCTION_VERSION,
  QUALITY_DIMENSIONS,
  candidateArmIdentity,
  directoryIdentity,
  metricStatistics,
  normalizeBaselineKind,
  persistRunWorkspace,
  promptArmIdentity,
  qualityDimensionSummary,
  redactText,
  redactValue,
  sha256,
  surfaceAnomalies,
  validateIndependentReviewArtifact,
  validateRunArtifact
} = require("./eval-workspace");

assert.equal(normalizeBaselineKind(), "terse");
assert.equal(normalizeBaselineKind("previous-skill"), "previous-skill");
assert.equal(normalizeBaselineKind("no-instruction"), "no-instruction");
assert.throws(() => normalizeBaselineKind("without-skill"), /must be one of/);
assert.equal(promptArmIdentity("terse").id, FROZEN_TERSE_INSTRUCTION_VERSION);
assert.equal(promptArmIdentity("no-instruction").kind, "no-instruction");
assert.throws(() => promptArmIdentity("previous-skill"), /PREVIOUS_SKILL_DIR/);

assert.match(redactText("API_TOKEN=private-value"), /API_TOKEN=<redacted>/);
assert.doesNotMatch(redactText("Authorization: Bearer abcdefghijklmnop"), /abcdefghijklmnop/);
assert.doesNotMatch(redactText('{"apiKey":"json-secret","credentials":"json-credentials"}'), /json-secret|json-credentials/);
assert.doesNotMatch(redactText("oauthToken: yaml-secret\nclientSecret: yaml-client-secret"), /yaml-secret|yaml-client-secret/);
assert.doesNotMatch(redactText("password: correct horse battery staple\nclientSecret: one two"), /horse|battery|staple|one two/);
assert.doesNotMatch(redactText("password: |\n  correct horse battery staple\nnext: visible"), /correct horse|battery staple/);
assert.doesNotMatch(redactText("'apiKey': quoted-yaml-secret\n\"oauthToken\": |\n  quoted block secret"), /quoted-yaml-secret|quoted block secret/);
assert.doesNotMatch(redactText('{"credentials":["array-secret"],"nested":{"credentials":{"opaque":"object-secret"}}}'), /array-secret|object-secret/);
assert.doesNotMatch(redactText("API_KEY=env-secret\nAPI_KEY = spaced-secret\nTOKEN=token-secret"), /env-secret|spaced-secret|token-secret/);
assert.doesNotMatch(redactText("{'apiKey': 'flow-secret'}\nconfig: {apiKey: nested-flow-secret}"), /flow-secret|nested-flow-secret/);
assert.equal(redactText(redactText('{"credentials":["array-secret"]}')), '{"credentials":"<redacted>"}');
assert.equal(redactText(path.join(os.homedir(), ".local", "bin", "agent")), path.join("<home>", ".local", "bin", "agent"));
const longRedactionStarted = process.hrtime.bigint();
assert.equal(redactText("x".repeat(200 * 1024)), "x".repeat(200 * 1024));
assert.ok(Number(process.hrtime.bigint() - longRedactionStarted) / 1e6 < 2000, "long plain-text redaction must remain bounded");
assert.deepEqual(
  redactValue({ model: { apiKey: "plain-secret", credentials: "structured-secret", nested: { authToken: "plain-token", oauthToken: "oauth-secret" }, monkey: "visible" }, tokens: { input_tokens: 2 }, tokenCount: 2 }),
  { model: { apiKey: "<redacted>", credentials: "<redacted>", nested: { authToken: "<redacted>", oauthToken: "<redacted>" }, monkey: "visible" }, tokens: { input_tokens: 2 }, tokenCount: 2 }
);
assert.equal(metricStatistics([10, 20]).varianceStatus, "insufficient-sample");
assert.equal(metricStatistics([10, 20]).stddev, null);
assert.equal(metricStatistics([10, 20, 30]).varianceStatus, "reported");
assert.equal(metricStatistics([]).median, "unknown");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-eval-workspace-"));
try {
  const skillDir = path.join(tempRoot, "skill");
  fs.mkdirSync(skillDir);
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), "---\nname: sample\ndescription: sample\n---\n");
  const candidateIdentity = candidateArmIdentity(skillDir);
  const taskDir = path.join(tempRoot, "task-workspace");
  fs.mkdirSync(taskDir);
  fs.writeFileSync(path.join(taskDir, "README.md"), "review target\n");
  const taskWorkspaceIdentity = directoryIdentity(taskDir);
  const filesystemReadIsolation = {
    status: "enforced",
    kind: "codex-permission-profile",
    profile: "eval_task_workspace_v1",
    projectRoot: "execution-cwd",
    networkAccess: "denied",
    policySha256: "a".repeat(64),
    environmentPolicySha256: "b".repeat(64)
  };
  assert.match(candidateIdentity.skill.digest, /^[a-f0-9]{64}$/);
  const identityBeforeEmptyDirectory = candidateIdentity.skill.digest;
  fs.mkdirSync(path.join(skillDir, "empty"));
  assert.notEqual(candidateArmIdentity(skillDir).skill.digest, identityBeforeEmptyDirectory);
  fs.rmdirSync(path.join(skillDir, "empty"));
  assert.throws(
    () => candidateArmIdentity(skillDir, { ablationId: "Not Valid", hypothesis: "test" }),
    /ABLATION_ID/
  );
  assert.throws(
    () => candidateArmIdentity(skillDir, { ablationId: "pruned-step" }),
    /HYPOTHESIS/
  );
  const ablationIdentity = candidateArmIdentity(skillDir, {
    ablationId: "pruned-step",
    ablationChange: "Remove one suspected no-op.",
    hypothesis: "Task outcomes stay equal while burden falls."
  });
  assert.equal(ablationIdentity.kind, "bounded-ablation");
  assert.equal(ablationIdentity.ablation.maximumAlternateCandidates, 1);
  assert.throws(
    () => promptArmIdentity("previous-skill", { previousSkillDir: skillDir, previousSkillId: "Not Valid" }),
    /PREVIOUS_SKILL_ID/
  );
  assert.throws(
    () => promptArmIdentity("previous-skill", { previousSkillDir: skillDir, previousSkillId: "candidate" }),
    /reserved candidate evidence path/
  );

  const dimensionRows = [
    { id: "applicability", winner: "candidate" },
    { id: "task-success", winner: "candidate" },
    { id: "missed-risks", winner: "candidate" },
    { id: "unnecessary-steps", winner: "baseline" },
    { id: "tool-calls", winner: "review" },
    { id: "elapsed-time", winner: "baseline" },
    { id: "output-burden", winner: "tie" }
  ];
  const results = [1, 2, 3].map((trial) => ({
    skill: "sample",
    id: "case-one",
    trial,
    trialCount: 3,
    status: "completed",
    judgmentStatus: "pass",
    taskWorkspaceIdentity,
    filesystemReadIsolation,
    armIdentities: { candidate: candidateIdentity, baseline: promptArmIdentity("terse") },
    measurements: {
      durationMs: trial === 3 ? 2500 : 100 + trial,
      outputBytes: 20,
      toolCalls: null,
      tokens: { input_tokens: trial === 3 ? 900 : 50, output_tokens: 50 }
    },
    checks: [
      { id: "case-1", expectation: "Always handled.", status: "pass" },
      { id: "case-2", expectation: "Variable behavior.", status: trial === 2 ? "fail" : "pass" },
      { id: "case-3", expectation: "Broken assertion.", status: "fail" },
      { id: "case-4", expectation: "Unverifiable assertion.", status: "review" }
    ],
    comparison: {
      enabled: true,
      skillValue: "improved",
      dimensions: dimensionRows,
      baseline: {
        status: "completed",
        taskWorkspaceIdentity,
        filesystemReadIsolation,
        measurements: {
          durationMs: 100,
          outputBytes: 20,
          toolCalls: null,
          tokens: { input_tokens: 40, output_tokens: 40 }
        },
        checks: [
          { id: "case-1", expectation: "Always handled.", status: "pass" },
          { id: "case-2", expectation: "Variable behavior.", status: "fail" },
          { id: "case-3", expectation: "Broken assertion.", status: "fail" },
          { id: "case-4", expectation: "Unverifiable assertion.", status: "review" }
        ]
      }
    },
    retainedEvidence: {
      candidate: {
        output: "candidate API_TOKEN=private-value work product",
        artifacts: [
          { path: "report.txt", size: 36, sha256: "source-text", content: "Bearer abcdefghijklmnop safe report" },
          { path: "image.bin", size: 4, sha256: "source-binary", content: null }
        ],
        executionTrace: []
      },
      baseline: { output: "baseline work product", artifacts: [], executionTrace: [] }
    }
  }));

  const quality = qualityDimensionSummary(results);
  assert.deepEqual(Object.keys(quality), QUALITY_DIMENSIONS);
  assert.equal(quality.applicability.counts.candidate, 3);
  assert.equal(quality["execution-burden"]["elapsed-time"].counts.baseline, 3);

  const anomalies = surfaceAnomalies(results);
  assert.equal(anomalies.length, 1);
  assert.ok(anomalies[0].assertions.some((item) => item.type === "always-pass-both-arms"));
  assert.ok(anomalies[0].assertions.some((item) => item.type === "always-fail-both-arms"));
  assert.ok(anomalies[0].assertions.some((item) => item.type === "varies-across-repeats"));
  assert.ok(anomalies[0].assertions.some((item) => item.type === "unverifiable-from-retained-evidence"));
  assert.ok(anomalies[0].outliers.some((item) => item.type === "durationMs-outlier"));
  assert.ok(anomalies[0].outliers.some((item) => item.type === "tokenCount-outlier"));
  const candidateOnlyAnomalies = surfaceAnomalies(results.map((result) => ({ ...result, comparison: { enabled: false } })));
  assert.equal(candidateOnlyAnomalies[0].assertions.some((item) => item.type === "always-pass-both-arms"), false);
  assert.equal(candidateOnlyAnomalies[0].assertions.some((item) => item.type === "always-fail-both-arms"), false);
  assert.equal(
    candidateOnlyAnomalies[0].assertions.some((item) => item.id === "case-1" && item.type === "unverifiable-from-retained-evidence"),
    false
  );

  const run = {
    schemaVersion: ARTIFACT_SCHEMA_VERSION,
    runId: "test-redacted-run",
    generatedAt: "2026-07-30T00:00:00.000Z",
    qualityTarget: "Test the evaluation artifact contract.",
    reportedDimensions: QUALITY_DIMENSIONS,
    comparisonEnabled: true,
    selectedCases: [{ id: "sample/case-one" }],
    repeats: 3,
    trialCount: 3,
    identities: {
      harness: { sourceSha256: "test" },
      model: { id: "test-model", configuration: { credentials: "manifest-secret", oauthToken: "manifest-oauth-secret" } },
      candidate: candidateIdentity,
      baseline: promptArmIdentity("terse")
    },
    aggregates: [{ skill: "sample", id: "case-one", qualityDimensions: quality }],
    anomalies,
    results
  };
  assert.deepEqual(validateRunArtifact(run), []);
  assert.ok(validateRunArtifact({}).length > 0);

  const target = path.join(tempRoot, "persisted-run");
  persistRunWorkspace(run, target);
  assert.ok(fs.existsSync(path.join(target, "manifest.json")));
  assert.ok(fs.existsSync(path.join(target, "benchmark.json")));
  assert.ok(fs.existsSync(path.join(target, "independent-review.json")));
  const candidateEvidence = path.join(target, "cases", "sample", "case-one", "trial-001", "candidate", "evidence.json");
  const trialJudgment = path.join(target, "cases", "sample", "case-one", "trial-001", "judgment.json");
  const persisted = fs.readFileSync(candidateEvidence, "utf8");
  const persistedManifest = fs.readFileSync(path.join(target, "manifest.json"), "utf8");
  const judgment = JSON.parse(fs.readFileSync(trialJudgment, "utf8"));
  assert.match(persisted, /<redacted>/);
  assert.doesNotMatch(persisted, /private-value|abcdefghijklmnop/);
  assert.doesNotMatch(persistedManifest, /manifest-secret|manifest-oauth-secret/);
  assert.match(persisted, /omitted-binary/);
  assert.match(persisted, /"toolCalls": "unknown"/);
  assert.match(persisted, /"executionTrace": "unknown"/);
  assert.equal(judgment.comparison.skillValue, "improved");
  assert.equal(judgment.comparison.baseline.evidence, "cases/sample/case-one/trial-001/terse-v1/evidence.json");
  assert.ok(fs.existsSync(path.join(target, judgment.contract.evidence)));
  assert.ok(fs.existsSync(path.join(target, judgment.comparison.baseline.evidence)));
  const independentReview = JSON.parse(fs.readFileSync(path.join(target, "independent-review.json"), "utf8"));
  assert.equal(independentReview.cases[0].judgment, "cases/sample/case-one/trial-001/judgment.json");
  assert.equal(independentReview.manifestSha256, sha256(fs.readFileSync(path.join(target, "manifest.json"))));
  assert.deepEqual(independentReview.claimAssessment, { status: "pending", rationale: "" });

  const approvedReview = {
    ...independentReview,
    reviewer: "independent-reviewer",
    independence: "Reviewed retained artifacts without generating the trials.",
    cases: independentReview.cases.map((item) => ({
      ...item,
      status: "approved",
      feedback: "Retained evidence supports this adjudication."
    })),
    claimAssessment: {
      status: "approved",
      rationale: "The bounded claim is supported for this exact run only."
    }
  };
  const currentClaimManifest = {
    runId: run.runId,
    selectedCases: run.selectedCases,
    repeats: run.repeats,
    trialCount: run.trialCount,
    comparisonEnabled: true,
    identities: { baseline: { id: "terse-v1" } },
    claimCalibration: { status: "pending-independent-review" }
  };
  assert.deepEqual(validateIndependentReviewArtifact(approvedReview, currentClaimManifest, target), []);
  const retainedManifestFile = path.join(target, "manifest.json");
  const retainedManifestSource = fs.readFileSync(retainedManifestFile);
  const tamperedManifest = JSON.parse(retainedManifestSource);
  tamperedManifest.hypothesis = "A different claim-defining hypothesis.";
  tamperedManifest.identities.model.id = "different-model";
  fs.writeFileSync(retainedManifestFile, `${JSON.stringify(tamperedManifest, null, 2)}\n`);
  assert.match(
    validateIndependentReviewArtifact(approvedReview, tamperedManifest, target).join("; "),
    /manifestSha256 does not match the retained manifest/
  );
  const retainedReviewFile = path.join(target, "independent-review.json");
  const retainedReviewSource = fs.readFileSync(retainedReviewFile);
  fs.writeFileSync(retainedReviewFile, `${JSON.stringify(approvedReview, null, 2)}\n`);
  const tamperedVerification = spawnSync(
    process.execPath,
    [path.join(__dirname, "verify-independent-review.js"), target],
    { encoding: "utf8" }
  );
  assert.notEqual(tamperedVerification.status, 0);
  assert.match(
    `${tamperedVerification.stdout || ""}\n${tamperedVerification.stderr || ""}`,
    /manifestSha256 does not match the retained manifest/
  );
  fs.writeFileSync(retainedReviewFile, retainedReviewSource);
  fs.writeFileSync(retainedManifestFile, retainedManifestSource);
  for (const topLevelName of ["manifest.json", "independent-review.json"]) {
    const topLevelFile = path.join(target, topLevelName);
    const source = fs.readFileSync(topLevelFile);
    const externalFile = path.join(tempRoot, `external-${topLevelName}`);
    fs.writeFileSync(externalFile, source);
    try {
      fs.rmSync(topLevelFile);
      fs.symlinkSync(externalFile, topLevelFile);
      const verified = spawnSync(
        process.execPath,
        [path.join(__dirname, "verify-independent-review.js"), target],
        { encoding: "utf8" }
      );
      assert.notEqual(verified.status, 0);
      assert.match(`${verified.stdout || ""}\n${verified.stderr || ""}`, /must not traverse a symbolic link/);
    } catch (error) {
      if (!error || !["EPERM", "EACCES"].includes(error.code)) throw error;
    } finally {
      try {
        if (fs.lstatSync(topLevelFile).isSymbolicLink()) fs.unlinkSync(topLevelFile);
      } catch (_error) {
        // Restore below when the symlink could not be created.
      }
      fs.writeFileSync(topLevelFile, source);
    }
  }
  const baselineEvidence = path.join(target, "cases", "sample", "case-one", "trial-001", "terse-v1", "evidence.json");
  const candidateEvidenceSource = fs.readFileSync(candidateEvidence);
  const baselineEvidenceSource = fs.readFileSync(baselineEvidence);
  const reboundReview = JSON.parse(JSON.stringify(approvedReview));
  const candidateEvidenceData = JSON.parse(candidateEvidenceSource);
  candidateEvidenceData.taskWorkspaceIdentity.digest = "0".repeat(64);
  fs.writeFileSync(candidateEvidence, `${JSON.stringify(candidateEvidenceData, null, 2)}\n`);
  assert.match(
    validateIndependentReviewArtifact(approvedReview, currentClaimManifest, target).join("; "),
    /artifactSha256.candidate does not match the retained artifact/
  );
  reboundReview.cases[0].artifactSha256.candidate = sha256(fs.readFileSync(candidateEvidence));
  assert.match(
    validateIndependentReviewArtifact(reboundReview, currentClaimManifest, target).join("; "),
    /digest does not match its retained file manifest/
  );
  fs.writeFileSync(candidateEvidence, candidateEvidenceSource);

  const unknownIsolationData = JSON.parse(candidateEvidenceSource);
  unknownIsolationData.execution.filesystemReadIsolation = { status: "unknown" };
  fs.writeFileSync(candidateEvidence, `${JSON.stringify(unknownIsolationData, null, 2)}\n`);
  const unknownIsolationReview = JSON.parse(JSON.stringify(approvedReview));
  unknownIsolationReview.cases[0].artifactSha256.candidate = sha256(fs.readFileSync(candidateEvidence));
  assert.match(
    validateIndependentReviewArtifact(unknownIsolationReview, currentClaimManifest, target).join("; "),
    /candidate filesystemReadIsolation\.status must be enforced/
  );
  fs.writeFileSync(candidateEvidence, candidateEvidenceSource);

  const networkEnabledIsolationData = JSON.parse(candidateEvidenceSource);
  networkEnabledIsolationData.execution.filesystemReadIsolation.networkAccess = "full";
  fs.writeFileSync(candidateEvidence, `${JSON.stringify(networkEnabledIsolationData, null, 2)}\n`);
  const networkEnabledIsolationReview = JSON.parse(JSON.stringify(approvedReview));
  networkEnabledIsolationReview.cases[0].artifactSha256.candidate = sha256(fs.readFileSync(candidateEvidence));
  assert.match(
    validateIndependentReviewArtifact(networkEnabledIsolationReview, currentClaimManifest, target).join("; "),
    /candidate filesystemReadIsolation\.networkAccess must be denied/
  );
  fs.writeFileSync(candidateEvidence, candidateEvidenceSource);

  const mismatchedIsolationData = JSON.parse(baselineEvidenceSource);
  mismatchedIsolationData.execution.filesystemReadIsolation.policySha256 = "c".repeat(64);
  fs.writeFileSync(baselineEvidence, `${JSON.stringify(mismatchedIsolationData, null, 2)}\n`);
  const mismatchedIsolationReview = JSON.parse(JSON.stringify(approvedReview));
  mismatchedIsolationReview.cases[0].artifactSha256.baseline = sha256(fs.readFileSync(baselineEvidence));
  assert.match(
    validateIndependentReviewArtifact(mismatchedIsolationReview, currentClaimManifest, target).join("; "),
    /candidate and baseline filesystemReadIsolation identities must match exactly/
  );
  fs.writeFileSync(baselineEvidence, baselineEvidenceSource);

  const differentTaskDir = path.join(tempRoot, "different-task-workspace");
  fs.mkdirSync(differentTaskDir);
  fs.writeFileSync(path.join(differentTaskDir, "README.md"), "different review target\n");
  const mismatchedBaselineData = JSON.parse(baselineEvidenceSource);
  mismatchedBaselineData.taskWorkspaceIdentity = directoryIdentity(differentTaskDir);
  fs.writeFileSync(baselineEvidence, `${JSON.stringify(mismatchedBaselineData, null, 2)}\n`);
  const mismatchedReview = JSON.parse(JSON.stringify(approvedReview));
  mismatchedReview.cases[0].artifactSha256.baseline = sha256(fs.readFileSync(baselineEvidence));
  assert.match(
    validateIndependentReviewArtifact(mismatchedReview, currentClaimManifest, target).join("; "),
    /candidate and baseline taskWorkspaceIdentity manifests must match exactly/
  );
  fs.writeFileSync(baselineEvidence, baselineEvidenceSource);

  const contaminatedTaskDir = path.join(tempRoot, "contaminated-task-workspace");
  fs.mkdirSync(path.join(contaminatedTaskDir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(contaminatedTaskDir, "scripts", "test-eval-hidden.js"), "hidden oracle\n");
  const contaminatedIdentity = directoryIdentity(contaminatedTaskDir);
  const contaminatedReview = JSON.parse(JSON.stringify(approvedReview));
  for (const [file, arm] of [[candidateEvidence, "candidate"], [baselineEvidence, "baseline"]]) {
    const data = JSON.parse(fs.readFileSync(file));
    data.taskWorkspaceIdentity = contaminatedIdentity;
    fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
    contaminatedReview.cases[0].artifactSha256[arm] = sha256(fs.readFileSync(file));
  }
  assert.match(
    validateIndependentReviewArtifact(contaminatedReview, currentClaimManifest, target).join("; "),
    /exposes an evaluator-owned or non-fixture eval surface/
  );
  fs.writeFileSync(candidateEvidence, candidateEvidenceSource);
  fs.writeFileSync(baselineEvidence, baselineEvidenceSource);

  const externalEvidence = path.join(tempRoot, "external-evidence.json");
  fs.writeFileSync(externalEvidence, candidateEvidenceSource);
  try {
    fs.rmSync(candidateEvidence);
    fs.symlinkSync(externalEvidence, candidateEvidence);
    assert.match(
      validateIndependentReviewArtifact(approvedReview, currentClaimManifest, target).join("; "),
      /must not traverse a symbolic link/
    );
  } catch (error) {
    if (!error || !["EPERM", "EACCES"].includes(error.code)) throw error;
  } finally {
    try {
      if (fs.lstatSync(candidateEvidence).isSymbolicLink()) fs.unlinkSync(candidateEvidence);
    } catch (_error) {
      // Restore below when the symlink could not be created.
    }
    fs.writeFileSync(candidateEvidence, candidateEvidenceSource);
  }
  assert.match(
    validateIndependentReviewArtifact(
      approvedReview,
      { ...currentClaimManifest, identities: { baseline: { id: "candidate" } } },
      target
    ).join("; "),
    /safe, non-candidate baseline artifact ID/
  );
  assert.match(
    validateIndependentReviewArtifact({ ...approvedReview, claimAssessment: undefined }, currentClaimManifest, target).join("; "),
    /claimAssessment must be approved/
  );
  const missingReferenceReview = JSON.parse(JSON.stringify(approvedReview));
  missingReferenceReview.cases[0].judgment = "cases/missing-judgment.json";
  assert.match(
    validateIndependentReviewArtifact(missingReferenceReview, currentClaimManifest, target).join("; "),
    /must match its case and trial path/
  );
  const duplicateReview = {
    ...approvedReview,
    cases: approvedReview.cases.map(() => JSON.parse(JSON.stringify(approvedReview.cases[0])))
  };
  assert.match(validateIndependentReviewArtifact(duplicateReview, currentClaimManifest, target).join("; "), /duplicates an earlier case and trial/);
  assert.match(
    validateIndependentReviewArtifact(
      { ...approvedReview, reviewer: " unassigned ", independence: " unknown " },
      currentClaimManifest,
      target
    ).join("; "),
    /reviewer must identify|independence must state/
  );
  const missingTrialCountManifest = { ...currentClaimManifest };
  delete missingTrialCountManifest.trialCount;
  assert.match(validateIndependentReviewArtifact(approvedReview, missingTrialCountManifest, target).join("; "), /trialCount must be a positive integer/);
  const legacyReview = {
    ...approvedReview,
    manifestDisposition: {
      status: "legacy-pre-gating",
      rationale: "The immutable manifest predates structured claim status; its boolean is not final approval."
    }
  };
  assert.match(
    validateIndependentReviewArtifact(
      legacyReview,
      { ...currentClaimManifest, claimCalibration: { eligibleForComparativeClaim: true } },
      target
    ).join("; "),
    /legacy runs cannot become claim-ready/
  );
  assert.match(
    validateIndependentReviewArtifact(
      legacyReview,
      {
        ...currentClaimManifest,
        claimCalibration: {
          status: "ineligible",
          eligibleForComparativeClaim: false,
          permanentIneligibility: { reason: "candidate-visible evaluator leakage" }
        }
      },
      target
    ).join("; "),
    /ineligible and legacy runs cannot become claim-ready/
  );

  const unattemptedRun = {
    ...run,
    runId: "test-unattempted-run",
    repeats: 1,
    trialCount: 1,
    results: [{
      skill: "sample",
      id: "case-one",
      trial: 1,
      trialCount: 1,
      status: "invalid-case",
      judgmentStatus: "review",
      command: null,
      checks: [],
      comparison: { enabled: true, status: "not-run", skillValue: "review" }
    }]
  };
  const unattemptedTarget = path.join(tempRoot, "unattempted-run");
  persistRunWorkspace(unattemptedRun, unattemptedTarget);
  const unattemptedBase = path.join(unattemptedTarget, "cases", "sample", "case-one", "trial-001");
  assert.equal(fs.existsSync(path.join(unattemptedBase, "candidate", "evidence.json")), false);
  assert.equal(fs.existsSync(path.join(unattemptedBase, "terse-v1", "evidence.json")), false);
  const unattemptedJudgment = JSON.parse(fs.readFileSync(path.join(unattemptedBase, "judgment.json"), "utf8"));
  assert.equal(unattemptedJudgment.contract.evidence, null);
  assert.equal(unattemptedJudgment.comparison.baseline.status, "not-executed");
  assert.equal(fs.readdirSync(tempRoot).some((name) => name.includes("staging")), false);
  assert.throws(() => persistRunWorkspace(run, target), /already exists/);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log("Evaluation workspace tests passed.");
