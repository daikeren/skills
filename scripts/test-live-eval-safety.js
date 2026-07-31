#!/usr/bin/env node

const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const { directoryIdentity } = require("./eval-workspace");
const {
  aggregateResults,
  baselinePromptFor,
  baselineIsolationLevel,
  benchmarkPolicyIdentity,
  booleanEnv,
  buildBaselinePrompt,
  buildJudgePrompt,
  buildNoInstructionPrompt,
  buildPrompt,
  buildComparisonJudgePrompt,
  caseIdentity,
  cleanupActiveTemporaryResources,
  cleanupCaseWorkspace,
  cleanupJudgeWorkspace,
  cleanupTemporaryCodexHome,
  cleanupTrialCodexHomes,
  collectArtifacts,
  comparativeClaimEligibility,
  comparativeStagesComplete,
  filesystemReadIsolationEligible,
  taskWorkspaceIdentityEligible,
  commandIdentity,
  commandEnvironment,
  configureLimits,
  createCaseWorkspace,
  createProgressReporter,
  createRunSourceSnapshot,
  currentWorktreeState,
  createJudgeWorkspace,
  createTemporaryCodexHome,
  createTrialCodexHomes,
  evidenceAppearsInOutput,
  evidenceList,
  expectationsFor,
  expandCaseTrials,
  formatProgressLine,
  installSignalCleanup,
  judgmentStatus,
  mapWithConcurrency,
  materializeFixtures,
  measurementsFor,
  normalizeCommandResult,
  normalizeComparison,
  normalizeJudgeChecks,
  parseFirstJsonObject,
  parseCaseFilter,
  redactCommandArgs,
  resolveCommandOverride,
  renderExecutionTrace,
  retainedArmView,
  renderSkillBundle,
  runCommand,
  selectCases,
  sanitizeTraceText,
  summarizeTraceCommand,
  terminateActiveProcessTrees,
  validateSkillArmDirectory
} = require("./run-live-evals");

async function main() {
const root = process.cwd();
assert.equal(resolveCommandOverride("codex"), "codex");
assert.equal(resolveCommandOverride("./scripts/mock-agent"), path.join(root, "scripts", "mock-agent"));
assert.equal(parseCaseFilter(undefined), null);
assert.deepEqual(
  [...parseCaseFilter("implement-change/intent-kernel-prevents-overbuilding, review-code/executable-proof-for-release-finding")],
  [
    "implement-change/intent-kernel-prevents-overbuilding",
    "review-code/executable-proof-for-release-finding"
  ]
);
assert.throws(() => parseCaseFilter("implement-change"), /skill\/case IDs/);
const isolatedCwd = path.join(os.tmpdir(), "live-eval-command-environment-test");
const isolatedEnvironment = commandEnvironment({
  env: {
    LIVE_EVAL_HIDDEN_ORACLE: "must-not-inherit",
    PWD: root,
    OLDPWD: root,
    INIT_CWD: root,
    npm_package_json: path.join(root, "package.json"),
    npm_config_local_prefix: root,
    SAFE_VALUE: "retained"
  }
}, isolatedCwd, { sourceRoots: [root] });
assert.equal(isolatedEnvironment.LIVE_EVAL_HIDDEN_ORACLE, undefined);
assert.equal(isolatedEnvironment.OLDPWD, undefined);
assert.equal(isolatedEnvironment.npm_package_json, undefined);
assert.equal(isolatedEnvironment.npm_config_local_prefix, undefined);
assert.equal(isolatedEnvironment.PWD, isolatedCwd);
assert.equal(isolatedEnvironment.INIT_CWD, isolatedCwd);
assert.equal(isolatedEnvironment.SAFE_VALUE, "retained");

const selectableCaseIds = new Set();
for (const file of fs.readdirSync(path.join(root, "evals", "cases"))) {
  if (!file.endsWith(".json")) continue;
  const data = JSON.parse(fs.readFileSync(path.join(root, "evals", "cases", file), "utf8"));
  for (const item of data.cases) selectableCaseIds.add(`${data.skill}/${item.id}`);
}
for (const readme of ["README.md", "README.zh-TW.md"]) {
  const text = fs.readFileSync(path.join(root, readme), "utf8");
  for (const match of text.matchAll(/LIVE_EVAL_CASES=([^\s\\]+)/g)) {
    for (const selector of match[1].split(",")) {
      assert.ok(selectableCaseIds.has(selector), `${readme} documents unknown live eval case ${selector}`);
    }
  }
}

assert.match(
  formatProgressLine({
    completed: 2,
    total: 5,
    key: "example-skill/example-case",
    phase: "baseline",
    status: "complete",
    durationMs: 1234,
    detail: "status=completed"
  }),
  /^\[live-eval 2\/5\] example-skill\/example-case baseline:complete 1234ms status=completed$/
);
const progressLogRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-progress-"));
try {
  const progressLog = path.join(progressLogRoot, "live-progress.log");
  const progressOutput = [];
  const progress = createProgressReporter(1, { write: (line) => progressOutput.push(line) }, progressLog);
  progress.phase("example-skill/example-case", "candidate", "start");
  progress.complete(
    "example-skill/example-case",
    { status: "completed", judgmentStatus: "pass", comparison: { skillValue: "improved" } },
    42
  );
  assert.equal(progressOutput.length, 2);
  const persistedProgress = fs.readFileSync(progressLog, "utf8");
  assert.match(persistedProgress, /\[live-eval 0\/1\] example-skill\/example-case candidate:start/);
  assert.match(persistedProgress, /\[live-eval 1\/1\].*case:complete 42ms.*value=improved/);
} finally {
  fs.rmSync(progressLogRoot, { recursive: true, force: true });
}

let activeWorkers = 0;
let maxActiveWorkers = 0;
const scheduledResults = await mapWithConcurrency([30, 5, 20, 1], 2, async (delay, index) => {
  activeWorkers += 1;
  maxActiveWorkers = Math.max(maxActiveWorkers, activeWorkers);
  await new Promise((resolve) => setTimeout(resolve, delay));
  activeWorkers -= 1;
  return `result-${index}`;
});
assert.equal(maxActiveWorkers, 2);
assert.deepEqual(scheduledResults, ["result-0", "result-1", "result-2", "result-3"]);
await assert.rejects(() => mapWithConcurrency([1], 0, async () => null), /positive integer/);
const selectedCases = selectCases(
  [
    {
      data: {
        skill: "implement-change",
        cases: [
          { id: "intent-kernel-prevents-overbuilding" },
          { id: "other-case" }
        ]
      }
    }
  ],
  new Set(["implement-change/intent-kernel-prevents-overbuilding"])
);
assert.equal(selectedCases.length, 1);
assert.equal(selectedCases[0].item.id, "intent-kernel-prevents-overbuilding");
assert.throws(
  () => selectCases([], new Set(["review-code/missing"])),
  /did not match: review-code\/missing/
);
assert.deepEqual(
  expandCaseTrials(selectedCases, 3).map(({ trial, trialCount }) => [trial, trialCount]),
  [[1, 3], [2, 3], [3, 3]]
);
const bundledSkill = renderSkillBundle("understand-change");
assert.match(bundledSkill, /Skill file SKILL\.md:/);
assert.match(bundledSkill, /Skill file references\/html-explainer-contract\.md:/);
assert.equal(
  validateSkillArmDirectory(path.join(root, "skills", "understand-change"), "understand-change"),
  path.join(root, "skills", "understand-change")
);
assert.throws(
  () => validateSkillArmDirectory(path.join(root, "skills", "understand-change"), "review-code"),
  /skill arm name must be review-code/
);
const bundledPrompt = buildPrompt(
  { skill: "understand-change" },
  { prompt: "Explain the change." },
  [],
  path.join(os.tmpdir(), "live-eval-artifacts")
);
assert.match(bundledPrompt, /Use the following Agent Skill bundle:/);
assert.doesNotMatch(bundledPrompt, /Use the Agent Skill at /);
assert.deepEqual(evidenceList("“exact runtime output”"), ["exact runtime output"]);
assert.deepEqual(evidenceList(["\"first quote\"", "second quote"]), ["first quote", "second quote"]);
assert.equal(evidenceAppearsInOutput("Exact runtime\noutput", ["Exact runtime\noutput"]), true);
assert.equal(evidenceAppearsInOutput("Exact runtime\noutput", ["exact runtime\noutput"]), false);
assert.equal(evidenceAppearsInOutput("Exact runtime\noutput", ["Exact runtime output"]), false);

const previousCompareBaseline = process.env.LIVE_EVAL_COMPARE_BASELINE;
try {
  delete process.env.LIVE_EVAL_COMPARE_BASELINE;
  assert.equal(booleanEnv("LIVE_EVAL_COMPARE_BASELINE"), false);
  process.env.LIVE_EVAL_COMPARE_BASELINE = "1";
  assert.equal(booleanEnv("LIVE_EVAL_COMPARE_BASELINE"), true);
  process.env.LIVE_EVAL_COMPARE_BASELINE = "false";
  assert.equal(booleanEnv("LIVE_EVAL_COMPARE_BASELINE"), false);
  process.env.LIVE_EVAL_COMPARE_BASELINE = "sometimes";
  assert.throws(() => booleanEnv("LIVE_EVAL_COMPARE_BASELINE"), /must be 1, 0, true, or false/);
} finally {
  if (previousCompareBaseline === undefined) {
    delete process.env.LIVE_EVAL_COMPARE_BASELINE;
  } else {
    process.env.LIVE_EVAL_COMPARE_BASELINE = previousCompareBaseline;
  }
}

const previousModelConfig = process.env.LIVE_EVAL_MODEL_CONFIG;
try {
  process.env.LIVE_EVAL_MODEL_CONFIG = "not-json";
  assert.throws(() => configureLimits(), /MODEL_CONFIG must be a JSON object/);
  process.env.LIVE_EVAL_MODEL_CONFIG = '{"temperature":0}';
  assert.doesNotThrow(() => configureLimits());
} finally {
  if (previousModelConfig === undefined) {
    delete process.env.LIVE_EVAL_MODEL_CONFIG;
  } else {
    process.env.LIVE_EVAL_MODEL_CONFIG = previousModelConfig;
  }
  configureLimits();
}

const baselinePrompt = buildBaselinePrompt(
  { prompt: "Explain the supplied change." },
  [{ name: "sample.md", content: "fixture content" }],
  "/tmp/comparative-artifacts"
);
assert.match(baselinePrompt, /base capabilities/);
assert.match(baselinePrompt, /Explain the supplied change/);
assert.doesNotMatch(baselinePrompt, /Use the Agent Skill at/);
assert.match(baselinePrompt, /If no artifact is useful, do not mention/i);
assert.match(baselinePrompt, /do not add a separate evidence or validation section/i);
const noInstructionPrompt = buildNoInstructionPrompt(
  { prompt: "Explain the supplied change." },
  [],
  "/tmp/comparative-artifacts"
);
assert.match(noInstructionPrompt, /^Task: Explain the supplied change\./);
assert.doesNotMatch(noInstructionPrompt, /base capabilities|Agent Skill/);
const previousSkillPrompt = baselinePromptFor(
  { skill: "understand-change" },
  { prompt: "Explain the supplied change." },
  [],
  "/tmp/comparative-artifacts",
  { kind: "previous-skill", previousSkillDir: path.join(root, "skills", "understand-change") }
);
assert.match(previousSkillPrompt, /Use the following Agent Skill bundle/);
assert.match(previousSkillPrompt, /Skill file SKILL\.md/);

const codexJsonl = [
  JSON.stringify({
    type: "item.completed",
    item: {
      type: "command_execution",
      command: "API_TOKEN=secret npm test -- --password hunter2",
      exit_code: 0,
      status: "completed"
    }
  }),
  JSON.stringify({
    type: "item.completed",
    item: { type: "file_change", changes: [{ path: "src/example.js", kind: "update" }] }
  }),
  JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "final answer" } }),
  JSON.stringify({ type: "turn.completed", usage: { input_tokens: 12, output_tokens: 8 } })
].join("\n");
const normalizedCodex = normalizeCommandResult(
  { output: codexJsonl, durationMs: 25, stdoutBytes: Buffer.byteLength(codexJsonl) },
  { outputFormat: "codex-jsonl" }
);
assert.equal(normalizedCodex.output, "final answer");
assert.equal(normalizedCodex.telemetry.toolCalls, 2);
assert.deepEqual(normalizedCodex.telemetry.toolCallBreakdown, { command_execution: 1, file_change: 1 });
assert.deepEqual(normalizedCodex.telemetry.tokens, { input_tokens: 12, output_tokens: 8 });
assert.equal(normalizedCodex.telemetry.executionTrace.length, 2);
const renderedTrace = renderExecutionTrace(normalizedCodex.telemetry.executionTrace);
assert.match(renderedTrace, /npm test/);
assert.match(renderedTrace, /src\/example\.js/);
assert.doesNotMatch(renderedTrace, /secret|hunter2/);

const noFinalMessageSecret = "raw-command-output-secret";
const noFinalMessageJsonl = [
  JSON.stringify({
    type: "item.completed",
    item: {
      type: "command_execution",
      command: `PRIVATE_TOKEN=${noFinalMessageSecret} npm test`,
      aggregated_output: noFinalMessageSecret,
      exit_code: 1,
      status: "failed"
    }
  }),
  JSON.stringify({ type: "turn.failed", error: { message: noFinalMessageSecret } })
].join("\n");
const normalizedNoFinalMessage = normalizeCommandResult(
  {
    status: 1,
    output: noFinalMessageJsonl,
    diagnostics: noFinalMessageJsonl,
    stderr: noFinalMessageSecret,
    durationMs: 10,
    stdoutBytes: Buffer.byteLength(noFinalMessageJsonl)
  },
  { outputFormat: "codex-jsonl" }
);
assert.equal(normalizedNoFinalMessage.output, "");
assert.equal(normalizedNoFinalMessage.diagnostics, "");
assert.equal(normalizedNoFinalMessage.stderr, "");
assert.doesNotMatch(JSON.stringify(normalizedNoFinalMessage), new RegExp(noFinalMessageSecret));

const malformedStructuredOutput = normalizeCommandResult(
  {
    status: 1,
    output: noFinalMessageSecret,
    diagnostics: noFinalMessageSecret,
    stderr: noFinalMessageSecret,
    durationMs: 10,
    stdoutBytes: Buffer.byteLength(noFinalMessageSecret)
  },
  { outputFormat: "codex-jsonl" }
);
assert.equal(malformedStructuredOutput.output, "");
assert.equal(malformedStructuredOutput.diagnostics, "");
assert.equal(malformedStructuredOutput.stderr, "");
assert.doesNotMatch(JSON.stringify(malformedStructuredOutput), new RegExp(noFinalMessageSecret));

assert.match(sanitizeTraceText("https://user:pass@example.com"), /<redacted>@example\.com/);
assert.doesNotMatch(sanitizeTraceText("curl -H 'Authorization: Bearer abcdefghijk' https://example.com"), /abcdefghijk/);
const traceSanitizeStartedAt = process.hrtime.bigint();
assert.equal(sanitizeTraceText("A".repeat(200_000)).length, 500);
assert.ok(Number(process.hrtime.bigint() - traceSanitizeStartedAt) / 1e6 < 1000, "trace sanitization must remain bounded");
for (const unsafeCommand of [
  "curl -H 'Cookie: session=topsecret' https://example.com",
  "curl -H 'X-API-Key: topsecret' https://example.com",
  "psql 'postgres://user:topsecret@db.example.com/app'",
  "PRIVATE_KEY=topsecret node deploy.js",
  "LABEL='private value with spaces' npm test",
  "curl -H 'Authorization: Bearer sk-abcdefghijklmnopqrst' https://example.com"
]) {
  const summarized = JSON.stringify(summarizeTraceCommand(unsafeCommand));
  assert.doesNotMatch(summarized, /topsecret|private value|abcdefghijklmnopqrst/);
}
for (const unsafeCommand of [
  "curl -u user:topsecret https://example.com",
  "curl --user user:topsecret https://example.com",
  "sshpass -p topsecret ssh example.com"
]) {
  const summarized = JSON.stringify(summarizeTraceCommand(unsafeCommand));
  assert.doesNotMatch(summarized, /user|topsecret|example\.com/);
}
assert.deepEqual(
  summarizeTraceCommand("/bin/zsh -lc 'npm run validate && git status --short'"),
  { tools: ["git", "npm"], actions: ["npm run validate", "git status"] }
);
const unknownCodexItem = normalizeCommandResult(
  {
    output: [
      JSON.stringify({ type: "item.completed", item: { type: "future_tool_type" } }),
      JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "future answer" } })
    ].join("\n"),
    durationMs: 10,
    stdoutBytes: 120
  },
  { outputFormat: "codex-jsonl" }
);
assert.equal(unknownCodexItem.output, "future answer");
assert.equal(unknownCodexItem.telemetry.toolCalls, null);

const malformedCodexTelemetry = normalizeCommandResult(
  {
    output: [
      JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "partial answer" } }),
      "{malformed-event"
    ].join("\n"),
    durationMs: 10,
    stdoutBytes: 120
  },
  { outputFormat: "codex-jsonl" }
);
assert.equal(malformedCodexTelemetry.output, "partial answer");
assert.equal(malformedCodexTelemetry.telemetry.toolCalls, null);
assert.equal(malformedCodexTelemetry.telemetry.toolCallBreakdown, null);
const schemaInvalidCodexTelemetry = normalizeCommandResult(
  {
    output: [
      JSON.stringify({ type: "item.completed", item: {} }),
      JSON.stringify({ type: "turn.completed", usage: {} })
    ].join("\n"),
    durationMs: 10,
    stdoutBytes: 100
  },
  { outputFormat: "codex-jsonl" }
);
assert.equal(schemaInvalidCodexTelemetry.telemetry.toolCalls, null);
assert.equal(schemaInvalidCodexTelemetry.telemetry.toolCallBreakdown, null);

const normalizedClaude = normalizeCommandResult(
  {
    output: JSON.stringify({ result: "claude answer", usage: { input_tokens: 4 } }),
    durationMs: 20,
    stdoutBytes: 80
  },
  { outputFormat: "claude-json" }
);
assert.equal(normalizedClaude.output, "claude answer");
assert.equal(normalizedClaude.telemetry.toolCalls, null);
assert.deepEqual(normalizedClaude.telemetry.tokens, { input_tokens: 4 });

const sampleMeasurements = measurementsFor(normalizedCodex, [{ size: 14 }, { size: 6 }]);
assert.equal(sampleMeasurements.durationMs, 25);
assert.equal(sampleMeasurements.outputBytes, Buffer.byteLength("final answer"));
assert.equal(sampleMeasurements.toolCalls, 2);
assert.equal(sampleMeasurements.artifactCount, 2);
assert.equal(sampleMeasurements.artifactBytes, 20);
assert.equal(measurementsFor({ output: "", telemetry: null }, []).durationMs, null);

const matchedTaskWorkspaceIdentity = {
  algorithm: "sha256",
  digest: "task-workspace-digest",
  files: [
    { type: "file", path: "README.md", sha256: "readme-digest", size: 1 },
    { type: "directory", path: "evals" },
    { type: "directory", path: "evals/fixtures" },
    { type: "file", path: "evals/fixtures/example.md", sha256: "fixture-digest", size: 1 }
  ]
};
const enforcedFilesystemReadIsolation = {
  status: "enforced",
  kind: "codex-permission-profile",
  profile: "eval_task_workspace_v1",
  projectRoot: "execution-cwd",
  networkAccess: "denied",
  policySha256: "a".repeat(64),
  environmentPolicySha256: "b".repeat(64)
};
const completedComparison = {
  status: "completed",
  judge: { status: "completed" },
  taskWorkspaceIdentity: matchedTaskWorkspaceIdentity,
  filesystemReadIsolation: enforcedFilesystemReadIsolation,
  comparison: {
    status: "completed",
    judge: { status: "completed" },
    baseline: {
      status: "completed",
      judge: { status: "completed" },
      taskWorkspaceIdentity: matchedTaskWorkspaceIdentity,
      filesystemReadIsolation: enforcedFilesystemReadIsolation
    }
  }
};
assert.equal(taskWorkspaceIdentityEligible([completedComparison]), true);
assert.equal(taskWorkspaceIdentityEligible([{
  ...completedComparison,
  comparison: {
    ...completedComparison.comparison,
    baseline: {
      ...completedComparison.comparison.baseline,
      taskWorkspaceIdentity: { ...matchedTaskWorkspaceIdentity, digest: "different-task-workspace" }
    }
  }
}]), false);
assert.equal(taskWorkspaceIdentityEligible([{
  ...completedComparison,
  taskWorkspaceIdentity: {
    ...matchedTaskWorkspaceIdentity,
    files: [...matchedTaskWorkspaceIdentity.files, { type: "file", path: "scripts/test-eval-hidden.js" }]
  }
}]), false);
assert.equal(filesystemReadIsolationEligible([completedComparison]), true);
assert.equal(filesystemReadIsolationEligible([{
  ...completedComparison,
  filesystemReadIsolation: { status: "unknown" }
}]), false);
assert.equal(filesystemReadIsolationEligible([{
  ...completedComparison,
  filesystemReadIsolation: {
    ...enforcedFilesystemReadIsolation,
    networkAccess: "full"
  }
}]), false);
assert.equal(filesystemReadIsolationEligible([{
  ...completedComparison,
  comparison: {
    ...completedComparison.comparison,
    baseline: {
      ...completedComparison.comparison.baseline,
      filesystemReadIsolation: {
        ...enforcedFilesystemReadIsolation,
        policySha256: "c".repeat(64)
      }
    }
  }
}]), false);
const exactWorktreeState = { status: "dirty", contentSha256: "content-hash" };
const exactSourceIdentity = { digest: "source-digest" };
const exactExecutionIdentity = Object.fromEntries(
  ["candidate", "baseline", "contractJudge", "baselineJudge", "comparisonJudge"]
    .map((key) => [key, { sha256: `${key}-digest`, stableThroughExit: true }])
);
const exactCaseIdentities = [{
  id: "sample/case-one",
  oracleRevision: { path: "evals/oracles/sample/case-one.json", sha256: "oracle-digest" }
}];
const exactBenchmarkPolicy = {
  id: "benchmark",
  version: "draft-1",
  status: "draft",
  sha256: "benchmark-digest",
  selectedEntries: [{
    id: "sample/case-one",
    readiness: "ready",
    oracle: "sample/case-one.json",
    sha256: "entry-digest"
  }]
};
const exactClaimContext = {
  benchmarkPolicy: exactBenchmarkPolicy,
  caseIdentities: exactCaseIdentities,
  independentReviewStatus: "approved"
};
assert.equal(comparativeClaimEligibility({
  ...exactClaimContext,
  comparisonEnabled: true,
  repeats: 2,
  modelId: "model-v1",
  modelConfiguration: {},
  sourceIdentity: exactSourceIdentity,
  executionIdentity: exactExecutionIdentity,
  worktreeState: exactWorktreeState,
  results: [completedComparison, completedComparison]
}), true);
assert.equal(comparativeClaimEligibility({
  ...exactClaimContext,
  comparisonEnabled: true,
  repeats: 2,
  modelId: "model-v1",
  modelConfiguration: {},
  sourceIdentity: exactSourceIdentity,
  executionIdentity: exactExecutionIdentity,
  worktreeState: exactWorktreeState,
  results: [completedComparison, { status: "command-failed", comparison: { status: "not-run" } }]
}), false);
assert.equal(comparativeClaimEligibility({
  ...exactClaimContext,
  comparisonEnabled: true,
  repeats: 2,
  modelId: "model-v1",
  modelConfiguration: {},
  sourceIdentity: exactSourceIdentity,
  executionIdentity: exactExecutionIdentity,
  worktreeState: exactWorktreeState,
  results: [completedComparison, { ...completedComparison, judge: { status: "command-failed" } }]
}), false);
assert.equal(comparativeClaimEligibility({
  ...exactClaimContext,
  comparisonEnabled: true,
  repeats: 2,
  modelId: "model-v1",
  modelConfiguration: {},
  sourceIdentity: exactSourceIdentity,
  executionIdentity: exactExecutionIdentity,
  worktreeState: { status: "dirty", contentSha256: "unknown" },
  results: [completedComparison, completedComparison]
}), true);
assert.equal(comparativeClaimEligibility({
  ...exactClaimContext,
  comparisonEnabled: true,
  repeats: 2,
  modelId: "model-v1",
  modelConfiguration: {},
  sourceIdentity: { digest: "unknown" },
  executionIdentity: exactExecutionIdentity,
  results: [completedComparison, completedComparison]
}), false);
assert.equal(comparativeClaimEligibility({
  ...exactClaimContext,
  comparisonEnabled: true,
  repeats: 2,
  modelId: "model-v1",
  modelConfiguration: {},
  sourceIdentity: exactSourceIdentity,
  executionIdentity: { ...exactExecutionIdentity, candidate: { sha256: "changed", stableThroughExit: false } },
  results: [completedComparison, completedComparison]
}), false);
assert.equal(comparativeClaimEligibility({
  ...exactClaimContext,
  comparisonEnabled: true,
  repeats: 2,
  modelId: "model-v1",
  modelConfiguration: {},
  sourceIdentity: exactSourceIdentity,
  executionIdentity: { ...exactExecutionIdentity, candidate: { sha256: "candidate", stableThroughExit: true, argsRedacted: true } },
  results: [completedComparison, completedComparison]
}), false);
assert.equal(comparativeClaimEligibility({
  ...exactClaimContext,
  comparisonEnabled: true,
  repeats: 2,
  modelId: "model-v1",
  modelConfiguration: { reasoning_effort: "high", apiKey: "must-redact" },
  sourceIdentity: exactSourceIdentity,
  executionIdentity: exactExecutionIdentity,
  results: [completedComparison, completedComparison]
}), false);
assert.equal(comparativeClaimEligibility({
  ...exactClaimContext,
  independentReviewStatus: "pending",
  comparisonEnabled: true,
  repeats: 2,
  modelId: "model-v1",
  modelConfiguration: {},
  sourceIdentity: exactSourceIdentity,
  executionIdentity: exactExecutionIdentity,
  results: [completedComparison, completedComparison]
}), false);
assert.equal(comparativeClaimEligibility({
  ...exactClaimContext,
  caseIdentities: [{ ...exactCaseIdentities[0], oracleRevision: null }],
  comparisonEnabled: true,
  repeats: 2,
  modelId: "model-v1",
  modelConfiguration: {},
  sourceIdentity: exactSourceIdentity,
  executionIdentity: exactExecutionIdentity,
  results: [completedComparison, completedComparison]
}), false);
assert.equal(comparativeClaimEligibility({
  ...exactClaimContext,
  benchmarkPolicy: {
    ...exactBenchmarkPolicy,
    selectedEntries: [{ ...exactBenchmarkPolicy.selectedEntries[0], readiness: "planned", oracle: null }]
  },
  comparisonEnabled: true,
  repeats: 2,
  modelId: "model-v1",
  modelConfiguration: {},
  sourceIdentity: exactSourceIdentity,
  executionIdentity: exactExecutionIdentity,
  results: [completedComparison, completedComparison]
}), false);
const policyCases = [{ data: { skill: "sample" }, item: { id: "case-one" } }];
const policyManifest = {
  id: "benchmark",
  version: "draft-1",
  status: "draft",
  entries: [{
    skill: "sample",
    case: "case-one",
    readiness: "ready",
    disposition: "keep",
    oracle: "sample/case-one.json"
  }]
};
const policyIdentity = benchmarkPolicyIdentity(policyManifest, policyCases);
const changedPolicyIdentity = benchmarkPolicyIdentity({
  ...policyManifest,
  entries: [{ ...policyManifest.entries[0], disposition: "adapt" }]
}, policyCases);
assert.notEqual(policyIdentity.sha256, changedPolicyIdentity.sha256);
assert.notEqual(policyIdentity.selectedEntries[0].sha256, changedPolicyIdentity.selectedEntries[0].sha256);
assert.match(commandIdentity(process.execPath, [], "test").sha256, /^[a-f0-9]{64}$/);
assert.deepEqual(
  redactCommandArgs(["--apiKey", "split-secret", "--auth-token=inline-secret", "--header", "Authorization: Bearer abcdefghijklmnop"]),
  {
    values: ["--apiKey", "<redacted>", "--auth-token=<redacted>", "--header", "<redacted credential-bearing text>"],
    redacted: true
  }
);
const sensitiveCommandIdentity = commandIdentity(process.execPath, ["--api-key", "split-secret"], "test");
assert.equal(sensitiveCommandIdentity.argsRedacted, true);
assert.doesNotMatch(JSON.stringify(sensitiveCommandIdentity), /split-secret/);
const relativePathRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-relative-path-"));
try {
  const relativeBin = path.join(relativePathRoot, "scripts");
  fs.mkdirSync(relativeBin);
  const relativeRunner = path.join(relativeBin, "runner");
  fs.writeFileSync(relativeRunner, "frozen runner\n", { mode: 0o700 });
  const relativeIdentity = commandIdentity("runner", [], "test", relativePathRoot, { PATH: "scripts" });
  assert.equal(relativeIdentity.resolvedPath, relativeRunner);
  assert.equal(relativeIdentity.sha256, require("crypto").createHash("sha256").update("frozen runner\n").digest("hex"));
  if (process.platform !== "win32") {
    const shadowBin = path.join(relativePathRoot, "shadow");
    fs.mkdirSync(shadowBin);
    fs.writeFileSync(path.join(shadowBin, "runner"), "not executable\n", { mode: 0o600 });
    const executableIdentity = commandIdentity("runner", [], "test", relativePathRoot, { PATH: "shadow:scripts" });
    assert.equal(executableIdentity.resolvedPath, relativeRunner);

    const cwdRunner = path.join(relativePathRoot, "runner");
    fs.writeFileSync(cwdRunner, "#!/bin/sh\nprintf 'cwd-runner'\n", { mode: 0o700 });
    const laterBin = path.join(relativePathRoot, "later");
    fs.mkdirSync(laterBin);
    const laterRunner = path.join(laterBin, "runner");
    fs.writeFileSync(laterRunner, "#!/bin/sh\nprintf 'later-runner'\n", { mode: 0o700 });
    const emptyPathEnv = { PATH: `${path.delimiter}${laterBin}` };
    const observedRunner = spawnSync("runner", [], {
      cwd: relativePathRoot,
      env: emptyPathEnv,
      encoding: "utf8"
    });
    const emptyPathIdentity = commandIdentity("runner", [], "test", relativePathRoot, emptyPathEnv);
    assert.equal(observedRunner.status, 0);
    assert.equal(observedRunner.stdout, "cwd-runner");
    assert.equal(emptyPathIdentity.resolvedPath, cwdRunner);
    assert.equal(emptyPathIdentity.sha256, require("crypto").createHash("sha256").update(fs.readFileSync(cwdRunner)).digest("hex"));
  }
} finally {
  fs.rmSync(relativePathRoot, { recursive: true, force: true });
}
const caseData = { skill: "test-skill", version: 1 };
const caseItem = { id: "fixture-freeze", fixtures: ["sample.txt"] };
const frozenCaseA = caseIdentity(caseData, caseItem, [{ name: "sample.txt", content: "A" }]);
const frozenCaseB = caseIdentity(caseData, caseItem, [{ name: "sample.txt", content: "B" }]);
assert.notEqual(frozenCaseA.fixtureRevision[0].sha256, frozenCaseB.fixtureRevision[0].sha256);
const frozenCaseWithOracle = caseIdentity(caseData, caseItem, [{ name: "sample.txt", content: "A" }], {
  path: "evals/oracles/test.json",
  sha256: "a".repeat(64),
  data: { id: "test-skill/fixture-freeze" }
});
assert.deepEqual(frozenCaseWithOracle.oracleRevision, {
  path: "evals/oracles/test.json",
  sha256: "a".repeat(64)
});
assert.throws(() => caseIdentity(caseData, caseItem), /frozen fixture content is required/);
const retainedBoundary = retainedArmView({
  output: `${"x".repeat(300 * 1024)}outside-retained-boundary`,
  artifacts: [{ path: "report.txt", content: `${"y".repeat(300 * 1024)}outside-artifact-boundary` }]
});
assert.equal(retainedBoundary.output.includes("outside-retained-boundary"), false);
assert.equal(retainedBoundary.artifacts[0].content.includes("outside-artifact-boundary"), false);
const parseStressStarted = process.hrtime.bigint();
assert.equal(parseFirstJsonObject("{".repeat(300 * 1024)), null);
assert.ok(Number(process.hrtime.bigint() - parseStressStarted) / 1e6 < 2000, "judge JSON extraction must remain linear-time bounded");
const observedWorktreeState = currentWorktreeState();
if (observedWorktreeState.status === "unknown") {
  assert.equal(observedWorktreeState.contentSha256, "unknown");
} else {
  assert.match(observedWorktreeState.contentSha256, /^(?:[a-f0-9]{64}|clean-at-revision)$/);
}
const nonRepository = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-non-repo-"));
try {
  assert.deepEqual(currentWorktreeState(nonRepository), {
    status: "unknown",
    changeCount: "unknown",
    statusSha256: "unknown",
    contentSha256: "unknown"
  });
} finally {
  fs.rmSync(nonRepository, { recursive: true, force: true });
}
if (spawnSync("git", ["--version"], { encoding: "utf8" }).status === 0) {
  const identityRepository = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-git-state-"));
  try {
    fs.writeFileSync(path.join(identityRepository, "tracked.txt"), "clean\n");
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: identityRepository }).status, 0);
    assert.equal(spawnSync("git", ["add", "tracked.txt"], { cwd: identityRepository }).status, 0);
    assert.equal(spawnSync("git", ["-c", "user.name=Eval Test", "-c", "user.email=eval@example.invalid", "commit", "-qm", "fixture"], { cwd: identityRepository }).status, 0);
    assert.equal(currentWorktreeState(identityRepository).contentSha256, "clean-at-revision");
    fs.writeFileSync(path.join(identityRepository, "tracked.txt"), "dirty-one\n");
    const firstDirtyHash = currentWorktreeState(identityRepository).contentSha256;
    assert.match(firstDirtyHash, /^[a-f0-9]{64}$/);
    fs.writeFileSync(path.join(identityRepository, "tracked.txt"), "dirty-two\n");
    assert.notEqual(currentWorktreeState(identityRepository).contentSha256, firstDirtyHash);
  } finally {
    fs.rmSync(identityRepository, { recursive: true, force: true });
  }
}
assert.equal(comparativeStagesComplete([completedComparison, completedComparison]), true);
const mutableSource = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-mutable-source-"));
let frozenSource;
try {
  fs.mkdirSync(path.join(mutableSource, "scripts"));
  fs.writeFileSync(path.join(mutableSource, "package.json"), "{}\n");
  fs.writeFileSync(path.join(mutableSource, "scripts", "ignored.log"), "before\n");
  fs.writeFileSync(path.join(mutableSource, "scripts", "test-eval-hidden.js"), "oracle conclusion\n");
  frozenSource = createRunSourceSnapshot(mutableSource);
  fs.writeFileSync(path.join(mutableSource, "scripts", "ignored.log"), "after\n");
  assert.equal(fs.readFileSync(path.join(frozenSource.repository, "scripts", "ignored.log"), "utf8"), "before\n");
  assert.ok(frozenSource.identity.files.some((file) => file.path === "scripts/ignored.log"));
  assert.ok(frozenSource.identity.files.some((file) => file.path === "scripts/test-eval-hidden.js"));
  const frozenTaskWorkspace = createCaseWorkspace({ sourceRoot: frozenSource.repository });
  try {
    assert.equal(fs.existsSync(path.join(frozenTaskWorkspace.workspace, "scripts", "test-eval-hidden.js")), false);
    assert.ok(fs.existsSync(path.join(frozenTaskWorkspace.workspace, "scripts", "ignored.log")));
  } finally {
    cleanupCaseWorkspace(frozenTaskWorkspace);
  }
} finally {
  cleanupCaseWorkspace(frozenSource);
  fs.rmSync(mutableSource, { recursive: true, force: true });
}

const normalizedComparison = normalizeComparison({
  summary: "candidate improved task quality",
  overallWinner: "A",
  dimensions: [
    { id: "applicability", winner: "A", reason: "more proportionate" },
    { id: "task-success", winner: "A", reason: "more complete" },
    { id: "missed-risks", winner: "A", reason: "caught a boundary" },
    { id: "unnecessary-steps", winner: "tie", reason: "both proportionate" },
    { id: "tool-calls", winner: "B", reason: "used fewer calls" },
    { id: "elapsed-time", winner: "B", reason: "finished sooner" },
    { id: "output-burden", winner: "tie", reason: "similar size" }
  ]
}, "A");
assert.equal(normalizedComparison.status, "completed");
assert.equal(normalizedComparison.skillValue, "improved");
assert.equal(normalizedComparison.dimensions.length, 7);
assert.equal(normalizeComparison({
  summary: "response A wins",
  overallWinner: "A",
  dimensions: normalizedComparison.dimensions.map((dimension) => ({
    id: dimension.id,
    winner: dimension.winner === "candidate" ? "A" : dimension.winner === "baseline" ? "B" : dimension.winner,
    reason: dimension.reason
  }))
}, "B").skillValue, "regressed");
assert.equal(normalizeComparison(null).skillValue, "review");
const incompleteComparison = normalizeComparison({
  summary: "unsupported conclusion",
  overallWinner: "A",
  dimensions: []
});
assert.equal(incompleteComparison.status, "invalid-json");
assert.equal(incompleteComparison.skillValue, "review");

const aggregateSample = aggregateResults([
  { skill: "example", id: "case", status: "completed", judgmentStatus: "pass", measurements: { durationMs: 30, outputBytes: 300, toolCalls: 3 }, comparison: { skillValue: "improved", dimensions: normalizedComparison.dimensions, baseline: { measurements: { durationMs: 20, outputBytes: 200, toolCalls: 2 } } } },
  { skill: "example", id: "case", status: "completed", judgmentStatus: "review", measurements: { durationMs: 10, outputBytes: 100, toolCalls: 1 }, comparison: { skillValue: "regressed", dimensions: normalizedComparison.dimensions, baseline: { measurements: { durationMs: 15, outputBytes: 150, toolCalls: 1 } } } },
  { skill: "example", id: "case", status: "completed", judgmentStatus: "pass", measurements: { durationMs: 20, outputBytes: 200, toolCalls: 2 }, comparison: { skillValue: "improved", dimensions: normalizedComparison.dimensions, baseline: { measurements: { durationMs: 18, outputBytes: 180, toolCalls: 1 } } } }
], true)[0];
assert.equal(aggregateSample.comparison.majoritySkillValue, "improved");
assert.equal(aggregateSample.comparison.skillValueRates.improved, 0.667);
assert.equal(aggregateSample.comparison.measurements.candidateMedian.durationMs, 20);
assert.equal(aggregateSample.comparison.measurements.pairedDeltaMedian.outputBytes, 20);

const conditionalExpectations = [
  {
    id: "trace-1",
    source: "trace",
    text: "When HTML is chosen, validate its core interaction.",
    requiresEvidence: true,
    allowsNotApplicable: true
  }
];
const notApplicableChecks = normalizeJudgeChecks(
  {
    summary: "HTML was not selected.",
    checks: [
      {
        id: "trace-1",
        status: "not-applicable",
        evidence: "",
        reason: "The response used chat and created no HTML artifact."
      }
    ]
  },
  conditionalExpectations,
  "chat response"
).checks;
assert.equal(notApplicableChecks[0].status, "not-applicable");
assert.deepEqual(notApplicableChecks[0].evidence, []);
assert.equal(judgmentStatus(notApplicableChecks), "pass");

const unconditionalNotApplicable = normalizeJudgeChecks(
  {
    checks: [
      {
        id: "case-1",
        status: "not-applicable",
        evidence: "",
        reason: "Skipped."
      }
    ]
  },
  [
    {
      id: "case-1",
      source: "case",
      text: "Explain the behavior.",
      requiresEvidence: false,
      allowsNotApplicable: false
    }
  ],
  ""
).checks;
assert.equal(unconditionalNotApplicable[0].status, "review");

const architectureEval = JSON.parse(
  fs.readFileSync(path.join(root, "evals", "cases", "architecture-review.json"), "utf8")
);
const architectureExpectations = expectationsFor(architectureEval, architectureEval.cases[0]);
const exhaustiveArchitectureCheck = architectureExpectations.find((expectation) =>
  expectation.text.startsWith("If recommending a split")
);
assert.ok(exhaustiveArchitectureCheck);
assert.equal(exhaustiveArchitectureCheck.allowsNotApplicable, false);
const exhaustiveNotApplicable = normalizeJudgeChecks(
  {
    checks: architectureExpectations.map((expectation) => ({
      id: expectation.id,
      status: expectation.id === exhaustiveArchitectureCheck.id ? "not-applicable" : "review",
      evidence: "",
      reason: expectation.id === exhaustiveArchitectureCheck.id ? "No recommendation was made." : "Not evaluated."
    }))
  },
  architectureExpectations,
  ""
).checks.find((check) => check.id === exhaustiveArchitectureCheck.id);
assert.equal(exhaustiveNotApplicable.status, "review");

const comparisonPrompt = buildComparisonJudgePrompt(
  { skill: "example-skill" },
  { id: "example", prompt: "Complete the example." },
  [],
  { output: "candidate", artifacts: [], measurements: sampleMeasurements },
  { output: "baseline", artifacts: [], measurements: { ...sampleMeasurements, toolCalls: null } }
);
assert.match(comparisonPrompt, /separate contract eval remains/i);
assert.match(comparisonPrompt, /identities are intentionally blinded/i);
assert.match(comparisonPrompt, /Response A measurements/);
assert.doesNotMatch(comparisonPrompt, /Candidate measurements|Without-skill baseline measurements/);
assert.match(comparisonPrompt, /untrusted eval evidence/);
assert.match(comparisonPrompt, /task success and missed risks are tied.*select the other response rather than tie/i);
const hiddenOracle = {
  path: "evals/oracles/example.json",
  sha256: "b".repeat(64),
  data: { invariant: "judge-only invariant token" }
};
const judgePrompt = buildJudgePrompt(
  { skill: "example-skill" },
  { id: "example", prompt: "Complete the example." },
  [],
  [],
  "agent output",
  [],
  [],
  hiddenOracle
);
assert.match(judgePrompt, /judge-only invariant token/);
assert.doesNotMatch(buildBaselinePrompt(
  { prompt: "Complete the example." },
  [],
  "/tmp/artifacts"
), /judge-only invariant token/);
assert.doesNotMatch(buildPrompt(
  { skill: "review-code" },
  { prompt: "Complete the example." },
  [],
  "/tmp/artifacts",
  { skillDirectory: path.join(root, "skills", "review-code") }
), /judge-only invariant token/);
const workspaceFixture = [{ name: "nested/patch-a.py", content: "secret workspace fixture token" }];
const workspaceItem = {
  prompt: "Review the workspace patch.",
  fixturePresentation: "workspace"
};
const workspaceCandidatePrompt = buildPrompt(
  { skill: "review-code" },
  workspaceItem,
  workspaceFixture,
  "/tmp/artifacts",
  { skillDirectory: path.join(root, "skills", "review-code") }
);
const workspaceBaselinePrompt = buildBaselinePrompt(workspaceItem, workspaceFixture, "/tmp/artifacts");
for (const prompt of [workspaceCandidatePrompt, workspaceBaselinePrompt]) {
  assert.match(prompt, /evals\/fixtures\/nested\/patch-a\.py/);
  assert.match(prompt, /Inspect the relevant files directly/);
  assert.doesNotMatch(prompt, /secret workspace fixture token/);
}
assert.match(buildBaselinePrompt(
  { prompt: "Review inline." },
  workspaceFixture,
  "/tmp/artifacts"
), /secret workspace fixture token/);
const comparisonPromptWithOracle = buildComparisonJudgePrompt(
  { skill: "example-skill" },
  { id: "example", prompt: "Complete the example." },
  [],
  { output: "candidate", artifacts: [], measurements: sampleMeasurements },
  { output: "baseline", artifacts: [], measurements: sampleMeasurements },
  true,
  hiddenOracle
);
assert.match(comparisonPromptWithOracle, /judge-only invariant token/);
assert.equal(baselineIsolationLevel(null, null), "matched-workspace-inline-skill-only");
assert.equal(baselineIsolationLevel("codex", null), "isolated-home-matched-workspace-inline-skill-only");
assert.equal(baselineIsolationLevel("codex", "custom-agent"), "matched-workspace-inline-skill-only");

let cleanupCalls = 0;
const removeSignalCleanup = installSignalCleanup(() => {
  cleanupCalls += 1;
});
removeSignalCleanup();
assert.equal(cleanupCalls, 0);

const fakeCodexSource = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-codex-source-"));
let fakeCodexHome;
let trialCodexHomes;
try {
  fs.writeFileSync(path.join(fakeCodexSource, "auth.json"), "{\"token\":\"test-only\"}\n", { mode: 0o600 });
  fakeCodexHome = createTemporaryCodexHome(fakeCodexSource);
  assert.notEqual(fakeCodexHome, fakeCodexSource);
  assert.equal(fs.readFileSync(path.join(fakeCodexHome, "auth.json"), "utf8"), "{\"token\":\"test-only\"}\n");
  assert.equal(fs.statSync(fakeCodexHome).mode & 0o777, 0o700);
  assert.equal(fs.statSync(path.join(fakeCodexHome, "auth.json")).mode & 0o777, 0o600);
  assert.equal(fs.statSync(path.join(fakeCodexHome, "config.toml")).mode & 0o777, 0o600);
  const unboundConfig = fs.readFileSync(path.join(fakeCodexHome, "config.toml"), "utf8");
  assert.match(unboundConfig, /default_permissions = "eval_task_workspace_v1"/);
  assert.match(unboundConfig, /\[permissions\.eval_task_workspace_v1\.network\]\nenabled = false/);
  assert.doesNotMatch(unboundConfig, /mode = "full"/);
  const boundWorkspace = path.join(os.tmpdir(), "bound-live-eval-workspace");
  commandEnvironment({
    env: { CODEX_HOME: fakeCodexHome },
    filesystemReadIsolation: enforcedFilesystemReadIsolation
  }, boundWorkspace);
  const boundConfig = fs.readFileSync(path.join(fakeCodexHome, "config.toml"), "utf8");
  assert.match(boundConfig, new RegExp(JSON.stringify(boundWorkspace).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(boundConfig, /TASK_WORKSPACE_NOT_BOUND/);
  trialCodexHomes = createTrialCodexHomes(true, fakeCodexSource);
  assert.deepEqual(Object.keys(trialCodexHomes).sort(), ["baseline", "baselineJudge", "candidate", "comparisonJudge", "contractJudge"]);
  assert.equal(new Set(Object.values(trialCodexHomes)).size, 5);
  for (const home of Object.values(trialCodexHomes)) {
    assert.equal(fs.readFileSync(path.join(home, "auth.json"), "utf8"), "{\"token\":\"test-only\"}\n");
  }
} finally {
  cleanupTrialCodexHomes(trialCodexHomes);
  cleanupTemporaryCodexHome(fakeCodexHome);
  fs.rmSync(fakeCodexSource, { recursive: true, force: true });
}
assert.equal(fs.existsSync(fakeCodexHome), false);
assert.ok(Object.values(trialCodexHomes).every((home) => !fs.existsSync(home)));

for (const signal of ["SIGHUP", "SIGINT", "SIGTERM"]) {
  const signalCleanupRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-signal-cleanup-"));
  try {
    const signalSource = path.join(signalCleanupRoot, "source");
    const resourceMarker = path.join(signalCleanupRoot, "resource-paths.json");
    const resourceMarkerStaging = `${resourceMarker}.tmp`;
    const activeCommandMarker = path.join(signalCleanupRoot, "active-command-finished");
    fs.mkdirSync(signalSource);
    fs.writeFileSync(path.join(signalSource, "auth.json"), "{\"token\":\"test-only\"}\n", { mode: 0o600 });
    const childCode = [
      `const fs = require("fs")`,
      `const runner = require(${JSON.stringify(path.join(root, "scripts", "run-live-evals.js"))})`,
      `runner.installSignalCleanup(() => { runner.terminateActiveProcessTrees(); runner.cleanupActiveTemporaryResources() })`,
      `const home = runner.createTemporaryCodexHome(${JSON.stringify(signalSource)})`,
      `const caseWorkspace = runner.createCaseWorkspace()`,
      `const judgeWorkspace = runner.createJudgeWorkspace()`,
      `runner.runCommand({ command: process.execPath, args: ["-e", ${JSON.stringify(`setTimeout(() => require("fs").writeFileSync(${JSON.stringify(activeCommandMarker)}, "unexpected"), 1000); setInterval(() => {}, 1000)`) }] }, process.cwd())`,
      `fs.writeFileSync(${JSON.stringify(resourceMarkerStaging)}, JSON.stringify([home, caseWorkspace.tempRoot, judgeWorkspace]))`,
      `fs.renameSync(${JSON.stringify(resourceMarkerStaging)}, ${JSON.stringify(resourceMarker)})`,
      "setInterval(() => {}, 1000)"
    ].join(";");
    const child = spawn(process.execPath, ["-e", childCode], { stdio: "ignore" });
    const waitArray = new Int32Array(new SharedArrayBuffer(4));
    const deadline = Date.now() + 3000;
    while (!fs.existsSync(resourceMarker) && Date.now() < deadline) {
      Atomics.wait(waitArray, 0, 0, 25);
    }
    assert.ok(fs.existsSync(resourceMarker), `${signal} cleanup child did not initialize`);
    const resources = JSON.parse(fs.readFileSync(resourceMarker, "utf8"));
    assert.equal(resources.length, 3);
    assert.ok(resources.every((resource) => fs.existsSync(resource)));
    child.kill(signal);
    const cleanupDeadline = Date.now() + 3000;
    while (resources.some((resource) => fs.existsSync(resource)) && Date.now() < cleanupDeadline) {
      Atomics.wait(waitArray, 0, 0, 25);
    }
    assert.ok(resources.every((resource) => !fs.existsSync(resource)), `${signal} left temporary resources behind`);
    Atomics.wait(waitArray, 0, 0, 1200);
    assert.equal(fs.existsSync(activeCommandMarker), false);
  } finally {
    fs.rmSync(signalCleanupRoot, { recursive: true, force: true });
  }
}

const mainSignalRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-main-signal-"));
let mainRunnerWorkspace;
try {
  mainRunnerWorkspace = createCaseWorkspace({ includeEvalSurfaces: true });
  const readyMarker = path.join(mainSignalRoot, "agent-ready");
  const activeCommandMarker = path.join(mainSignalRoot, "active-command-finished");
  const blockingAgent = path.join(mainSignalRoot, "blocking-agent.js");
  fs.writeFileSync(
    blockingAgent,
    [
      "#!/usr/bin/env node",
      'const fs = require("fs")',
      'fs.writeFileSync(process.env.EVAL_TEST_READY_MARKER, "ready")',
      'setTimeout(() => fs.writeFileSync(process.env.EVAL_TEST_ACTIVE_MARKER, "unexpected"), 1000)',
      "setInterval(() => {}, 1000)"
    ].join("\n"),
    { mode: 0o700 }
  );
  const tempPrefix = "engineering-judgment-live-eval-";
  const before = new Set(fs.readdirSync(os.tmpdir()).filter((name) => name.startsWith(tempPrefix)));
  const runner = spawn(process.execPath, [path.join(mainRunnerWorkspace.workspace, "scripts", "run-live-evals.js")], {
    cwd: mainRunnerWorkspace.workspace,
    env: {
      ...process.env,
      LIVE_EVAL_COMMAND: blockingAgent,
      LIVE_EVAL_CASES: "implement-change/cross-stack-change",
      EVAL_TEST_ACTIVE_MARKER: activeCommandMarker,
      EVAL_TEST_READY_MARKER: readyMarker,
      LIVE_EVAL_TIMEOUT_MS: "5000"
    },
    stdio: "ignore"
  });
  const waitArray = new Int32Array(new SharedArrayBuffer(4));
  const readyDeadline = Date.now() + 15000;
  while (!fs.existsSync(readyMarker) && Date.now() < readyDeadline) {
    Atomics.wait(waitArray, 0, 0, 25);
  }
  assert.ok(fs.existsSync(readyMarker), "custom-command main runner did not initialize");
  const activeTempRoots = fs
    .readdirSync(os.tmpdir())
    .filter((name) => name.startsWith(tempPrefix) && !before.has(name))
    .map((name) => path.join(os.tmpdir(), name));
  assert.ok(activeTempRoots.length > 0, "custom-command main runner did not create a case workspace");
  runner.kill("SIGTERM");
  const cleanupDeadline = Date.now() + 3000;
  while (activeTempRoots.some((resource) => fs.existsSync(resource)) && Date.now() < cleanupDeadline) {
    Atomics.wait(waitArray, 0, 0, 25);
  }
  assert.ok(activeTempRoots.every((resource) => !fs.existsSync(resource)), "custom-command main runner left temporary resources behind");
  Atomics.wait(waitArray, 0, 0, 1200);
  assert.equal(fs.existsSync(activeCommandMarker), false);
} finally {
  cleanupCaseWorkspace(mainRunnerWorkspace);
  fs.rmSync(mainSignalRoot, { recursive: true, force: true });
}

const comparativeWorkspace = createCaseWorkspace({ includeEvalSurfaces: true });
try {
  fs.writeFileSync(path.join(comparativeWorkspace.workspace, "scripts", "ignored-eval-input.log"), "ignored but copied execution input\n");
  const mockRunner = path.join(comparativeWorkspace.tempRoot, "mock-live-agent.js");
  fs.writeFileSync(
    mockRunner,
    [
      "#!/usr/bin/env node",
      'const fs = require("fs")',
      'let input = ""',
      'process.stdin.setEncoding("utf8")',
      'process.stdin.on("data", (chunk) => { input += chunk })',
      'process.stdin.on("end", () => {',
      '  if (input.includes("You are comparing two agent results")) {',
      '    process.stdout.write(JSON.stringify({ summary: "equivalent mock results", overallWinner: "tie", dimensions: [',
      '      { id: "applicability", winner: "tie", reason: "same mock result" },',
      '      { id: "task-success", winner: "tie", reason: "same mock result" },',
      '      { id: "missed-risks", winner: "tie", reason: "same mock result" },',
      '      { id: "unnecessary-steps", winner: "tie", reason: "same mock result" },',
      '      { id: "tool-calls", winner: "review", reason: "custom runner has no telemetry" },',
      '      { id: "elapsed-time", winner: "review", reason: "single sample" },',
      '      { id: "output-burden", winner: "tie", reason: "same mock result" }',
      '    ] }))',
      '    return',
      '  }',
      '  if (input.includes("You are judging a live eval result")) {',
      '    if (process.env.MOCK_FAIL_BASELINE_JUDGE === "1" && input.includes("mock work product baseline")) {',
      '      process.stderr.write("baseline judge failed intentionally")',
      '      process.exitCode = 7',
      '      return',
      '    }',
      '    const start = input.indexOf("Expectations:\\n") + "Expectations:\\n".length',
      '    const end = input.indexOf("\\n\\nAgent output:", start)',
      '    const expectations = JSON.parse(input.slice(start, end))',
      '    process.stdout.write(JSON.stringify({ summary: "mock contract pass", checks: expectations.map((item) => ({ id: item.id, status: "pass", evidence: "mock work product", reason: "mock evidence" })) }))',
      '    return',
      '  }',
      '  if (process.env.MOCK_INVALID_BASELINE_ARTIFACT === "1" && input.includes("Complete the task and return the work product.")) {',
      '    const match = input.match(/Disposable artifact directory: ([^\\n]+)/)',
      '    if (match) fs.symlinkSync(process.cwd(), match[1] + "/unsafe-link")',
      '    process.stdout.write("baseline output retained after invalid artifact")',
      '    return',
      '  }',
      '  process.stdout.write(input.includes("Complete the task and return the work product.") ? "mock work product baseline" : "mock work product candidate")',
      '})'
    ].join("\n"),
    { mode: 0o700 }
  );
  const comparativeResult = spawnSync(
    process.execPath,
    [path.join(comparativeWorkspace.workspace, "scripts", "run-live-evals.js")],
    {
      cwd: comparativeWorkspace.workspace,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        LIVE_EVAL_COMMAND: mockRunner,
        LIVE_EVAL_JUDGE_COMMAND: mockRunner,
        LIVE_EVAL_CASES: "route-work/ambiguous-routing,understand-change/small-change-uses-chat",
        LIVE_EVAL_COMPARE_BASELINE: "1",
        LIVE_EVAL_CONCURRENCY: "2",
        LIVE_EVAL_REPEATS: "3",
        LIVE_EVAL_TIMEOUT_MS: "1000"
      }
    }
  );
  assert.equal(
    comparativeResult.status,
    0,
    `comparative runner failed:\n${comparativeResult.stdout || ""}\n${comparativeResult.stderr || ""}`
  );
  assert.match(comparativeResult.stderr, /Live eval starting 2 case\(s\) across 6 trial\(s\) with concurrency 2\./);
  assert.match(comparativeResult.stderr, /route-work\/ambiguous-routing \[trial 1\/3\] candidate:start/);
  assert.match(comparativeResult.stderr, /understand-change\/small-change-uses-chat \[trial 3\/3\] baseline:complete/);
  assert.match(comparativeResult.stderr, /contract-judge:complete \d+ms status=completed/);
  assert.match(comparativeResult.stderr, /baseline-judge:complete \d+ms status=completed/);
  assert.match(comparativeResult.stderr, /comparison-judge:complete \d+ms status=completed value=neutral/);
  assert.match(comparativeResult.stderr, /\[live-eval 6\/6\].*case:complete/);
  const trialOnePrefix = "route-work/ambiguous-routing [trial 1/3]";
  const trialTwoPrefix = "route-work/ambiguous-routing [trial 2/3]";
  const phasePosition = (prefix, phase) => comparativeResult.stderr.indexOf(`${prefix} ${phase}:start`);
  for (const [prefix, phase] of [
    [trialOnePrefix, "candidate"],
    [trialOnePrefix, "baseline"],
    [trialOnePrefix, "contract-judge"],
    [trialTwoPrefix, "baseline"],
    [trialTwoPrefix, "candidate"],
    [trialTwoPrefix, "contract-judge"]
  ]) {
    assert.ok(phasePosition(prefix, phase) >= 0, `missing ${prefix} ${phase}:start`);
  }
  assert.ok(phasePosition(trialOnePrefix, "candidate") < phasePosition(trialOnePrefix, "baseline"));
  assert.ok(phasePosition(trialOnePrefix, "baseline") < phasePosition(trialOnePrefix, "contract-judge"));
  assert.ok(phasePosition(trialTwoPrefix, "baseline") < phasePosition(trialTwoPrefix, "candidate"));
  assert.ok(phasePosition(trialTwoPrefix, "candidate") < phasePosition(trialTwoPrefix, "contract-judge"));
  const comparativeOutput = JSON.parse(
    fs.readFileSync(path.join(comparativeWorkspace.workspace, "evals", "results", "live-latest.json"), "utf8")
  );
  assert.equal(comparativeOutput.comparisonEnabled, true);
  assert.equal(comparativeOutput.identities.model.id, "unknown");
  assert.equal(comparativeOutput.identities.execution.candidate.command, "<workspace>/mock-live-agent.js");
  assert.match(comparativeOutput.identities.execution.candidate.sha256, /^[a-f0-9]{64}$/);
  assert.ok(comparativeOutput.identities.harness.runSourceSnapshot.files.some((file) => file.path === "scripts/ignored-eval-input.log"));
  assert.match(comparativeOutput.identities.harness.benchmarkPolicy.sha256, /^[a-f0-9]{64}$/);
  assert.ok(comparativeOutput.identities.harness.benchmarkPolicy.selectedEntries.every((entry) => entry.readiness === "unlisted"));
  assert.equal(comparativeOutput.claimCalibration.eligibleForComparativeClaim, false);
  assert.equal(comparativeOutput.claimCalibration.status, "ineligible");
  assert.match(comparativeOutput.claimCalibration.materialUncertainty.join("\n"), /ready benchmark-policy entry or frozen oracle identity/);
  assert.doesNotMatch(comparativeOutput.claimCalibration.materialUncertainty.join("\n"), /lacked complete candidate, baseline, contract-judge, or comparison-judge evidence/);
  assert.equal(comparativeOutput.concurrency, 2);
  assert.equal(comparativeOutput.repeats, 3);
  assert.equal(comparativeOutput.results.length, 6);
  assert.deepEqual(
    comparativeOutput.results.map((item) => `${item.skill}/${item.id}`),
    [
      "route-work/ambiguous-routing",
      "route-work/ambiguous-routing",
      "route-work/ambiguous-routing",
      "understand-change/small-change-uses-chat",
      "understand-change/small-change-uses-chat",
      "understand-change/small-change-uses-chat"
    ]
  );
  assert.deepEqual(comparativeOutput.results.map((item) => item.trial), [1, 2, 3, 1, 2, 3]);
  assert.ok(comparativeOutput.results.every((item) => item.judgmentStatus === "pass"));
  assert.ok(comparativeOutput.results.every((item) => item.comparison.status === "completed"));
  assert.ok(comparativeOutput.results.every((item) => item.comparison.skillValue === "neutral"));
  assert.ok(comparativeOutput.results.every((item) => item.comparison.baseline.status === "completed"));

  const invalidBaselineResult = spawnSync(
    process.execPath,
    [path.join(comparativeWorkspace.workspace, "scripts", "run-live-evals.js")],
    {
      cwd: comparativeWorkspace.workspace,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        LIVE_EVAL_COMMAND: mockRunner,
        LIVE_EVAL_JUDGE_COMMAND: mockRunner,
        LIVE_EVAL_CASES: "route-work/ambiguous-routing",
        LIVE_EVAL_COMPARE_BASELINE: "1",
        LIVE_EVAL_REPEATS: "2",
        LIVE_EVAL_TIMEOUT_MS: "1000",
        MOCK_INVALID_BASELINE_ARTIFACT: "1"
      }
    }
  );
  assert.equal(invalidBaselineResult.status, 1, "incomplete comparison must fail the live evaluation command");
  assert.match(invalidBaselineResult.stderr, /2 incomplete comparisons/);
  const invalidBaselineOutput = JSON.parse(
    fs.readFileSync(path.join(comparativeWorkspace.workspace, "evals", "results", "live-latest.json"), "utf8")
  );
  assert.ok(invalidBaselineOutput.results.every((item) => item.comparison.baseline.status === "invalid-artifact"));
  const invalidRunDirectory = path.join(comparativeWorkspace.workspace, invalidBaselineOutput.runDirectory);
  const firstJudgment = JSON.parse(fs.readFileSync(
    path.join(invalidRunDirectory, "cases", "route-work", "ambiguous-routing", "trial-001", "judgment.json"),
    "utf8"
  ));
  const baselineEvidencePath = firstJudgment.comparison.baseline.evidence;
  assert.ok(baselineEvidencePath, "attempted invalid baseline must retain an evidence reference");
  const baselineEvidence = JSON.parse(fs.readFileSync(path.join(invalidRunDirectory, baselineEvidencePath), "utf8"));
  assert.equal(baselineEvidence.status, "invalid-artifact");
  assert.match(baselineEvidence.output.text, /baseline output retained/);
  assert.match(firstJudgment.comparison.baseline.error, /symbolic link/);

  const failedBaselineJudgeResult = spawnSync(
    process.execPath,
    [path.join(comparativeWorkspace.workspace, "scripts", "run-live-evals.js")],
    {
      cwd: comparativeWorkspace.workspace,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        LIVE_EVAL_COMMAND: mockRunner,
        LIVE_EVAL_JUDGE_COMMAND: mockRunner,
        LIVE_EVAL_CASES: "route-work/ambiguous-routing",
        LIVE_EVAL_COMPARE_BASELINE: "1",
        LIVE_EVAL_REPEATS: "2",
        LIVE_EVAL_TIMEOUT_MS: "1000",
        MOCK_FAIL_BASELINE_JUDGE: "1"
      }
    }
  );
  assert.equal(failedBaselineJudgeResult.status, 1, "failed baseline contract judging must fail the live evaluation command");
  assert.match(failedBaselineJudgeResult.stderr, /2 incomplete comparisons/);
  const failedBaselineJudgeOutput = JSON.parse(
    fs.readFileSync(path.join(comparativeWorkspace.workspace, "evals", "results", "live-latest.json"), "utf8")
  );
  const failedJudgeRun = path.join(comparativeWorkspace.workspace, failedBaselineJudgeOutput.runDirectory);
  const failedJudgeJudgment = JSON.parse(fs.readFileSync(
    path.join(failedJudgeRun, "cases", "route-work", "ambiguous-routing", "trial-001", "judgment.json"),
    "utf8"
  ));
  assert.equal(failedJudgeJudgment.comparison.status, "completed");
  assert.equal(failedJudgeJudgment.comparison.baseline.judge.status, "command-failed");
  assert.match(failedJudgeJudgment.comparison.baseline.judge.error, /command exited with code 7/);
  assert.deepEqual(
    comparativeOutput.results.slice(0, 3).map((item) => item.comparison.presentationOrder.A),
    ["candidate", "baseline", "candidate"]
  );
  assert.deepEqual(
    comparativeOutput.results.slice(0, 3).map((item) => item.comparison.generationOrder),
    [
      ["candidate", "baseline"],
      ["baseline", "candidate"],
      ["candidate", "baseline"]
    ]
  );
  assert.equal(comparativeOutput.aggregates.length, 2);
  assert.ok(comparativeOutput.aggregates.every((item) => item.comparison.majoritySkillValue === "neutral"));
  assert.ok(comparativeOutput.aggregates.every((item) => item.comparison.skillValueCounts.neutral === 3));
  assert.ok(comparativeOutput.aggregates.every((item) => item.comparison.measurements.candidateMedian.outputBytes > 0));
  assert.ok(comparativeOutput.aggregates.every((item) => item.comparison.measurements.candidateMedian.tokenCount === "unknown"));
  assert.ok(comparativeOutput.anomalies.every((item) => item.assertions.some((anomaly) => anomaly.type === "always-pass-both-arms")));
  assert.equal(
    comparativeOutput.results[0].comparison.baseline.isolation,
    "matched-workspace-inline-skill-only"
  );
  assert.equal(comparativeOutput.results[0].comparison.baseline.judgmentStatus, "pass");
  assert.equal(comparativeOutput.results[0].comparison.candidate.measurements.toolCalls, null);
  const persistedRun = path.join(comparativeWorkspace.workspace, comparativeOutput.runDirectory);
  assert.ok(fs.existsSync(path.join(persistedRun, "manifest.json")));
  assert.ok(fs.existsSync(path.join(persistedRun, "benchmark.json")));
  assert.ok(fs.existsSync(path.join(persistedRun, "independent-review.json")));
  assert.ok(fs.existsSync(path.join(
    persistedRun,
    "cases",
    "route-work",
    "ambiguous-routing",
    "trial-001",
    "candidate",
    "evidence.json"
  )));
} finally {
  cleanupCaseWorkspace(comparativeWorkspace);
}

const baselineFirstFailureWorkspace = createCaseWorkspace({ includeEvalSurfaces: true });
try {
  const failingCandidateRunner = path.join(baselineFirstFailureWorkspace.tempRoot, "fail-candidate-agent.js");
  fs.writeFileSync(
    failingCandidateRunner,
    [
      "#!/usr/bin/env node",
      'let input = ""',
      'process.stdin.setEncoding("utf8")',
      'process.stdin.on("data", (chunk) => { input += chunk })',
      'process.stdin.on("end", () => {',
      '  if (input.includes("Use the following Agent Skill bundle")) {',
      '    process.stderr.write("candidate failed intentionally")',
      '    process.exitCode = 1',
      '    return',
      '  }',
      '  process.stdout.write("baseline completed work product")',
      '})'
    ].join("\n"),
    { mode: 0o700 }
  );
  const failedComparisonResult = spawnSync(
    process.execPath,
    [path.join(baselineFirstFailureWorkspace.workspace, "scripts", "run-live-evals.js")],
    {
      cwd: baselineFirstFailureWorkspace.workspace,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        LIVE_EVAL_COMMAND: failingCandidateRunner,
        LIVE_EVAL_CASES: "route-work/ambiguous-routing",
        LIVE_EVAL_COMPARE_BASELINE: "1",
        LIVE_EVAL_CONCURRENCY: "1",
        LIVE_EVAL_REPEATS: "2",
        LIVE_EVAL_MODEL: "test-model",
        LIVE_EVAL_MODEL_CONFIG: '{"reasoning_effort":"test"}',
        LIVE_EVAL_TIMEOUT_MS: "1000"
      }
    }
  );
  assert.notEqual(failedComparisonResult.status, 0);
  const failedComparisonOutput = JSON.parse(
    fs.readFileSync(path.join(baselineFirstFailureWorkspace.workspace, "evals", "results", "live-latest.json"), "utf8")
  );
  assert.equal(failedComparisonOutput.claimCalibration.eligibleForComparativeClaim, false);
  assert.match(failedComparisonOutput.claimCalibration.materialUncertainty.join("\n"), /lacked complete candidate, baseline, contract-judge, or comparison-judge evidence/);
  const failedRun = path.join(baselineFirstFailureWorkspace.workspace, failedComparisonOutput.runDirectory);
  const secondTrial = path.join(failedRun, "cases", "route-work", "ambiguous-routing", "trial-002");
  assert.ok(fs.existsSync(path.join(secondTrial, "candidate", "evidence.json")));
  assert.ok(fs.existsSync(path.join(secondTrial, "terse-v1", "evidence.json")));
  const failedJudgment = JSON.parse(fs.readFileSync(path.join(secondTrial, "judgment.json"), "utf8"));
  assert.equal(failedJudgment.comparison.status, "candidate-failed");
  assert.equal(failedJudgment.comparison.baseline.status, "completed");
  assert.ok(fs.existsSync(path.join(failedRun, failedJudgment.comparison.baseline.evidence)));
} finally {
  cleanupCaseWorkspace(baselineFirstFailureWorkspace);
}

const caseWorkspace = createCaseWorkspace();
let externalArtifactTarget;
try {
  assert.notEqual(caseWorkspace.workspace, root);
  assert.equal(path.dirname(caseWorkspace.workspace), caseWorkspace.tempRoot);
  assert.equal(path.dirname(caseWorkspace.artifactDir), caseWorkspace.tempRoot);
  assert.notEqual(caseWorkspace.artifactDir, caseWorkspace.workspace);
  assert.ok(fs.existsSync(caseWorkspace.artifactDir));
  assert.equal(fs.existsSync(path.join(caseWorkspace.workspace, "skills")), false);
  assert.equal(fs.existsSync(path.join(caseWorkspace.workspace, ".git")), false);
  assert.equal(fs.existsSync(path.join(caseWorkspace.workspace, "evals")), false);
  assert.equal(fs.existsSync(path.join(caseWorkspace.workspace, "scripts", "test-eval-benchmark.js")), false);
  assert.equal(fs.existsSync(path.join(caseWorkspace.workspace, "scripts", "test-live-eval-safety.js")), false);
  assert.equal(fs.existsSync(path.join(caseWorkspace.workspace, "scripts", "run-live-evals.js")), false);
  assert.equal(fs.existsSync(path.join(caseWorkspace.workspace, "scripts", "verify-independent-review.js")), false);
  assert.ok(fs.existsSync(path.join(caseWorkspace.workspace, "scripts", "validate-skills.js")));
  assert.ok(fs.existsSync(path.join(caseWorkspace.workspace, "README.md")));

  const markerName = ".live-eval-isolation-marker";
  fs.writeFileSync(path.join(caseWorkspace.workspace, markerName), "isolated\n");
  assert.equal(fs.existsSync(path.join(root, markerName)), false);

  const artifact = path.join(caseWorkspace.artifactDir, "explainer.html");
  fs.writeFileSync(artifact, "<!doctype html><title>Safe explainer</title>\n");
  const collected = collectArtifacts(caseWorkspace.artifactDir);
  assert.equal(collected.length, 1);
  assert.equal(collected[0].path, "explainer.html");
  assert.match(collected[0].content, /Safe explainer/);
  assert.match(collected[0].sha256, /^[a-f0-9]{64}$/);
  assert.throws(() => collectArtifacts(caseWorkspace.artifactDir, 4), /exceeds the 4-byte total limit/);

  const outside = path.join(caseWorkspace.tempRoot, "outside.html");
  const link = path.join(caseWorkspace.artifactDir, "outside-link.html");
  fs.writeFileSync(outside, "outside\n");
  try {
    fs.symlinkSync(outside, link);
    assert.throws(() => collectArtifacts(caseWorkspace.artifactDir), /must not be a symbolic link/);
  } catch (error) {
    if (error.code !== "EPERM") throw error;
  }

  fs.rmSync(caseWorkspace.artifactDir, { recursive: true, force: true });
  externalArtifactTarget = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-external-artifacts-"));
  fs.writeFileSync(path.join(externalArtifactTarget, "secret.html"), "must not be collected\n");
  try {
    fs.symlinkSync(externalArtifactTarget, caseWorkspace.artifactDir);
    assert.throws(
      () => collectArtifacts(caseWorkspace.artifactDir, 1024, caseWorkspace.tempRoot),
      /artifact directory must not be a symbolic link/
    );
  } catch (error) {
    if (error.code !== "EPERM") throw error;
  }
} finally {
  cleanupCaseWorkspace(caseWorkspace);
  if (externalArtifactTarget) {
    fs.rmSync(externalArtifactTarget, { recursive: true, force: true });
  }
}
assert.equal(fs.existsSync(caseWorkspace.tempRoot), false);

const baselineWorkspace = createCaseWorkspace({ withoutSkills: true });
const fixtureCandidateWorkspace = createCaseWorkspace();
try {
  assert.ok(fs.existsSync(path.join(baselineWorkspace.workspace, "AGENTS.md")));
  assert.ok(fs.existsSync(path.join(baselineWorkspace.workspace, "package.json")));
  assert.equal(fs.existsSync(path.join(baselineWorkspace.workspace, "evals")), false);
  assert.equal(fs.existsSync(path.join(baselineWorkspace.workspace, "skills")), false);
  assert.equal(fs.existsSync(path.join(baselineWorkspace.workspace, "commands")), false);
  assert.equal(fs.existsSync(path.join(baselineWorkspace.workspace, ".claude")), false);
  assert.equal(fs.existsSync(path.join(baselineWorkspace.workspace, ".codex-plugin")), false);
  assert.ok(fs.existsSync(baselineWorkspace.artifactDir));
  const selectedFixtures = [{ name: "nested/executable-proof.js", content: "console.log('proof')\n" }];
  materializeFixtures(selectedFixtures, baselineWorkspace.workspace);
  materializeFixtures(selectedFixtures, fixtureCandidateWorkspace.workspace);
  const fixtureRelativePath = path.join("evals", "fixtures", "nested", "executable-proof.js");
  assert.equal(
    fs.readFileSync(path.join(baselineWorkspace.workspace, fixtureRelativePath), "utf8"),
    fs.readFileSync(path.join(fixtureCandidateWorkspace.workspace, fixtureRelativePath), "utf8")
  );
  const baselineTaskIdentity = directoryIdentity(baselineWorkspace.workspace);
  const candidateTaskIdentity = directoryIdentity(fixtureCandidateWorkspace.workspace);
  assert.deepEqual(
    baselineTaskIdentity,
    candidateTaskIdentity,
    "candidate and baseline task-workspace manifests must be identical after fixture materialization"
  );
  assert.equal(taskWorkspaceIdentityEligible([{
    ...completedComparison,
    taskWorkspaceIdentity: candidateTaskIdentity,
    comparison: {
      ...completedComparison.comparison,
      baseline: {
        ...completedComparison.comparison.baseline,
        taskWorkspaceIdentity: baselineTaskIdentity
      }
    }
  }]), true);
  assert.throws(
    () => materializeFixtures([{ name: "../../outside.js", content: "unsafe" }], baselineWorkspace.workspace),
    /outside the task workspace/
  );
} finally {
  cleanupCaseWorkspace(baselineWorkspace);
  cleanupCaseWorkspace(fixtureCandidateWorkspace);
}
assert.equal(fs.existsSync(baselineWorkspace.tempRoot), false);
assert.equal(fs.existsSync(fixtureCandidateWorkspace.tempRoot), false);

const judgeWorkspace = createJudgeWorkspace();
try {
  assert.notEqual(judgeWorkspace, root);
  assert.deepEqual(fs.readdirSync(judgeWorkspace), []);
} finally {
  cleanupJudgeWorkspace(judgeWorkspace);
}
assert.equal(fs.existsSync(judgeWorkspace), false);

const implicitAblation = spawnSync(
  process.execPath,
  [path.join(root, "scripts", "run-live-evals.js")],
  {
    cwd: root,
    encoding: "utf8",
    timeout: 5000,
    env: {
      ...process.env,
      LIVE_EVAL_COMMAND: process.execPath,
      LIVE_EVAL_CASES: "understand-change/small-change-uses-chat",
      LIVE_EVAL_ABLATION_ID: "missing-directory",
      LIVE_EVAL_HYPOTHESIS: "This must be rejected before execution."
    }
  }
);
assert.notEqual(implicitAblation.status, 0);
assert.match(
  `${implicitAblation.stdout || ""}\n${implicitAblation.stderr || ""}`,
  /LIVE_EVAL_ABLATION_ID requires LIVE_EVAL_CANDIDATE_SKILL_DIR/
);

const leakingArmRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-leaking-arm-"));
try {
  const leakageGuard = JSON.parse(fs.readFileSync(
    path.join(root, "evals", "oracles", "review-code", "deployment-policy-bypass.json"),
    "utf8"
  )).leakageGuards[0];
  for (const name of ["candidate", "previous"]) {
    const directory = path.join(leakingArmRoot, name);
    fs.cpSync(path.join(root, "skills", "review-code"), directory, { recursive: true });
    fs.writeFileSync(
      path.join(directory, "LEAKED-ORACLE.md"),
      Buffer.concat([Buffer.from([0]), Buffer.from(`${leakageGuard}\n`)])
    );
  }
  const leakingAblation = spawnSync(
    process.execPath,
    [path.join(root, "scripts", "run-live-evals.js")],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        LIVE_EVAL_COMMAND: process.execPath,
        LIVE_EVAL_CASES: "review-code/deployment-policy-bypass",
        LIVE_EVAL_CANDIDATE_SKILL_DIR: path.join(leakingArmRoot, "candidate"),
        LIVE_EVAL_ABLATION_ID: "leaking-candidate",
        LIVE_EVAL_HYPOTHESIS: "The runtime arm leakage guard must reject this candidate before execution."
      }
    }
  );
  assert.notEqual(leakingAblation.status, 0);
  assert.match(
    `${leakingAblation.stdout || ""}\n${leakingAblation.stderr || ""}`,
    /candidate review-code snapshot leaks review-code\/deployment-policy-bypass oracle guard/
  );

  const leakingPreviousSkill = spawnSync(
    process.execPath,
    [path.join(root, "scripts", "run-live-evals.js")],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        LIVE_EVAL_COMMAND: process.execPath,
        LIVE_EVAL_CASES: "review-code/deployment-policy-bypass",
        LIVE_EVAL_COMPARE_BASELINE: "1",
        LIVE_EVAL_BASELINE: "previous-skill",
        LIVE_EVAL_PREVIOUS_SKILL_DIR: path.join(leakingArmRoot, "previous")
      }
    }
  );
  assert.notEqual(leakingPreviousSkill.status, 0);
  assert.match(
    `${leakingPreviousSkill.stdout || ""}\n${leakingPreviousSkill.stderr || ""}`,
    /previous-skill review-code snapshot leaks review-code\/deployment-policy-bypass oracle guard/
  );
} finally {
  fs.rmSync(leakingArmRoot, { recursive: true, force: true });
}

const identicalPreviousSkill = spawnSync(
  process.execPath,
  [path.join(root, "scripts", "run-live-evals.js")],
  {
    cwd: root,
    encoding: "utf8",
    timeout: 5000,
    env: {
      ...process.env,
      LIVE_EVAL_COMMAND: process.execPath,
      LIVE_EVAL_CASES: "understand-change/small-change-uses-chat",
      LIVE_EVAL_COMPARE_BASELINE: "1",
      LIVE_EVAL_BASELINE: "previous-skill",
      LIVE_EVAL_PREVIOUS_SKILL_DIR: path.join(root, "skills", "understand-change")
    }
  }
);
assert.notEqual(identicalPreviousSkill.status, 0);
assert.match(
  `${identicalPreviousSkill.stdout || ""}\n${identicalPreviousSkill.stderr || ""}`,
  /previous-skill baseline must differ from the candidate/
);

const previousTimeout = process.env.LIVE_EVAL_TIMEOUT_MS;
const processTreeTemp = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-process-tree-"));
try {
  process.env.LIVE_EVAL_TIMEOUT_MS = "50";
  configureLimits();
  const marker = path.join(processTreeTemp, "descendant-finished");
  const childCode = `setTimeout(() => require("fs").writeFileSync(${JSON.stringify(marker)}, "unexpected"), 250)`;
  const parentCode = [
    'const { spawn } = require("child_process")',
    `spawn(process.execPath, ["-e", ${JSON.stringify(childCode)}], { stdio: "ignore" })`,
    "setInterval(() => {}, 1000)"
  ].join(";");
  const result = await runCommand(
    { command: process.execPath, args: ["-e", parentCode] },
    root
  );
  assert.equal(result.status, 1);
  assert.match(result.error || "", /ETIMEDOUT/);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 400);
  assert.equal(fs.existsSync(marker), false);

  process.env.LIVE_EVAL_TIMEOUT_MS = "1000";
  configureLimits();
  const normalExitMarker = path.join(processTreeTemp, "normal-exit-descendant-finished");
  const normalExitChildCode = `setTimeout(() => require("fs").writeFileSync(${JSON.stringify(normalExitMarker)}, "unexpected"), 250)`;
  const normalExitParentCode = [
    'const { spawn } = require("child_process")',
    `const child = spawn(process.execPath, ["-e", ${JSON.stringify(normalExitChildCode)}], { stdio: "ignore" })`,
    "child.unref()"
  ].join(";");
  const normalExitResult = await runCommand(
    { command: process.execPath, args: ["-e", normalExitParentCode] },
    root
  );
  assert.equal(normalExitResult.status, 0);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 400);
  assert.equal(fs.existsSync(normalExitMarker), false);
  const nonzeroExitResult = await runCommand(
    { command: process.execPath, args: ["-e", "process.stderr.write('intentional failure'); process.exit(7)"] },
    root
  );
  assert.equal(nonzeroExitResult.status, 1);
  assert.equal(nonzeroExitResult.exitCode, 7);
  assert.equal(nonzeroExitResult.error, "command exited with code 7");
} finally {
  fs.rmSync(processTreeTemp, { recursive: true, force: true });
  if (previousTimeout === undefined) {
    delete process.env.LIVE_EVAL_TIMEOUT_MS;
  } else {
    process.env.LIVE_EVAL_TIMEOUT_MS = previousTimeout;
  }
}

const stdinResult = await runCommand(
  {
    command: process.execPath,
    args: ["-e", "process.stdin.pipe(process.stdout)"],
    input: "prompt transported through stdin"
  },
  root
);
assert.equal(stdinResult.status, 0);
assert.equal(stdinResult.output, "prompt transported through stdin");
assert.ok(stdinResult.durationMs >= 0);
assert.equal(stdinResult.stdoutBytes, Buffer.byteLength("prompt transported through stdin"));

const separatedOutput = await runCommand(
  {
    command: process.execPath,
    args: ["-e", "process.stdout.write('agent result'); process.stderr.write('echoed user prompt')"]
  },
  root
);
assert.equal(separatedOutput.output, "agent result");
assert.equal(separatedOutput.stderr, "echoed user prompt");
assert.equal(separatedOutput.output.includes("echoed user prompt"), false);

const environmentIsolationRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-command-environment-"));
try {
  const environmentResult = await runCommand({
    command: process.execPath,
    args: ["-e", "process.stdout.write(JSON.stringify({live:process.env.LIVE_EVAL_HIDDEN_ORACLE,pwd:process.env.PWD,init:process.env.INIT_CWD,old:process.env.OLDPWD,npm:process.env.npm_package_json,safe:process.env.SAFE_VALUE}))"],
    env: {
      LIVE_EVAL_HIDDEN_ORACLE: "must-not-inherit",
      PWD: root,
      INIT_CWD: root,
      OLDPWD: root,
      npm_package_json: path.join(root, "package.json"),
      SAFE_VALUE: "retained"
    }
  }, environmentIsolationRoot, { sourceRoots: [root] });
  assert.equal(environmentResult.status, 0);
  assert.deepEqual(JSON.parse(environmentResult.output), {
    pwd: environmentIsolationRoot,
    init: environmentIsolationRoot,
    safe: "retained"
  });
} finally {
  fs.rmSync(environmentIsolationRoot, { recursive: true, force: true });
}

}

main()
  .then(() => console.log("Live eval safety tests passed."))
  .catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
