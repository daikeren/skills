#!/usr/bin/env node

const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const {
  aggregateResults,
  baselineIsolationLevel,
  booleanEnv,
  buildBaselinePrompt,
  buildPrompt,
  buildComparisonJudgePrompt,
  cleanupActiveTemporaryResources,
  cleanupCaseWorkspace,
  cleanupJudgeWorkspace,
  cleanupTemporaryCodexHome,
  collectArtifacts,
  configureLimits,
  createCaseWorkspace,
  createProgressReporter,
  createJudgeWorkspace,
  createTemporaryCodexHome,
  evidenceAppearsInOutput,
  evidenceList,
  expectationsFor,
  expandCaseTrials,
  formatProgressLine,
  installSignalCleanup,
  judgmentStatus,
  mapWithConcurrency,
  measurementsFor,
  normalizeCommandResult,
  normalizeComparison,
  normalizeJudgeChecks,
  parseCaseFilter,
  resolveCommandOverride,
  renderExecutionTrace,
  renderSkillBundle,
  runCommand,
  selectCases,
  sanitizeTraceText,
  summarizeTraceCommand,
  terminateActiveProcessTrees
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
assert.match(sanitizeTraceText("https://user:pass@example.com"), /<redacted>@example\.com/);
assert.doesNotMatch(sanitizeTraceText("curl -H 'Authorization: Bearer abcdefghijk' https://example.com"), /abcdefghijk/);
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

const normalizedComparison = normalizeComparison({
  summary: "candidate improved task quality",
  overallWinner: "A",
  dimensions: [
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
assert.equal(normalizedComparison.dimensions.length, 6);
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
try {
  fs.writeFileSync(path.join(fakeCodexSource, "auth.json"), "{\"token\":\"test-only\"}\n", { mode: 0o600 });
  fakeCodexHome = createTemporaryCodexHome(fakeCodexSource);
  assert.notEqual(fakeCodexHome, fakeCodexSource);
  assert.equal(fs.readFileSync(path.join(fakeCodexHome, "auth.json"), "utf8"), "{\"token\":\"test-only\"}\n");
  assert.equal(fs.statSync(fakeCodexHome).mode & 0o777, 0o700);
  assert.equal(fs.statSync(path.join(fakeCodexHome, "auth.json")).mode & 0o777, 0o600);
} finally {
  cleanupTemporaryCodexHome(fakeCodexHome);
  fs.rmSync(fakeCodexSource, { recursive: true, force: true });
}
assert.equal(fs.existsSync(fakeCodexHome), false);

for (const signal of ["SIGHUP", "SIGINT", "SIGTERM"]) {
  const signalCleanupRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-signal-cleanup-"));
  try {
    const signalSource = path.join(signalCleanupRoot, "source");
    const resourceMarker = path.join(signalCleanupRoot, "resource-paths.json");
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
      `fs.writeFileSync(${JSON.stringify(resourceMarker)}, JSON.stringify([home, caseWorkspace.tempRoot, judgeWorkspace]))`,
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
      'fs.writeFileSync(process.env.LIVE_EVAL_TEST_READY_MARKER, "ready")',
      'setTimeout(() => fs.writeFileSync(process.env.LIVE_EVAL_TEST_ACTIVE_MARKER, "unexpected"), 1000)',
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
      LIVE_EVAL_TEST_ACTIVE_MARKER: activeCommandMarker,
      LIVE_EVAL_TEST_READY_MARKER: readyMarker,
      LIVE_EVAL_TIMEOUT_MS: "5000"
    },
    stdio: "ignore"
  });
  const waitArray = new Int32Array(new SharedArrayBuffer(4));
  const readyDeadline = Date.now() + 5000;
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
  const mockRunner = path.join(comparativeWorkspace.tempRoot, "mock-live-agent.js");
  fs.writeFileSync(
    mockRunner,
    [
      "#!/usr/bin/env node",
      'let input = ""',
      'process.stdin.setEncoding("utf8")',
      'process.stdin.on("data", (chunk) => { input += chunk })',
      'process.stdin.on("end", () => {',
      '  if (input.includes("You are comparing two agent results")) {',
      '    process.stdout.write(JSON.stringify({ summary: "equivalent mock results", overallWinner: "tie", dimensions: [',
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
      '    const start = input.indexOf("Expectations:\\n") + "Expectations:\\n".length',
      '    const end = input.indexOf("\\n\\nAgent output:", start)',
      '    const expectations = JSON.parse(input.slice(start, end))',
      '    process.stdout.write(JSON.stringify({ summary: "mock contract pass", checks: expectations.map((item) => ({ id: item.id, status: "pass", evidence: "mock work product", reason: "mock evidence" })) }))',
      '    return',
      '  }',
      '  process.stdout.write("mock work product")',
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
  assert.match(comparativeResult.stderr, /comparison-judge:complete \d+ms status=completed value=neutral/);
  assert.match(comparativeResult.stderr, /\[live-eval 6\/6\].*case:complete/);
  const comparativeOutput = JSON.parse(
    fs.readFileSync(path.join(comparativeWorkspace.workspace, "evals", "results", "live-latest.json"), "utf8")
  );
  assert.equal(comparativeOutput.comparisonEnabled, true);
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
  assert.deepEqual(
    comparativeOutput.results.slice(0, 3).map((item) => item.comparison.presentationOrder.A),
    ["candidate", "baseline", "candidate"]
  );
  assert.equal(comparativeOutput.aggregates.length, 2);
  assert.ok(comparativeOutput.aggregates.every((item) => item.comparison.majoritySkillValue === "neutral"));
  assert.ok(comparativeOutput.aggregates.every((item) => item.comparison.skillValueCounts.neutral === 3));
  assert.ok(comparativeOutput.aggregates.every((item) => item.comparison.measurements.candidateMedian.outputBytes > 0));
  assert.equal(
    comparativeOutput.results[0].comparison.baseline.isolation,
    "matched-workspace-inline-skill-only"
  );
  assert.equal(comparativeOutput.results[0].comparison.candidate.measurements.toolCalls, null);
} finally {
  cleanupCaseWorkspace(comparativeWorkspace);
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
try {
  assert.ok(fs.existsSync(path.join(baselineWorkspace.workspace, "AGENTS.md")));
  assert.ok(fs.existsSync(path.join(baselineWorkspace.workspace, "package.json")));
  assert.equal(fs.existsSync(path.join(baselineWorkspace.workspace, "evals")), false);
  assert.equal(fs.existsSync(path.join(baselineWorkspace.workspace, "skills")), false);
  assert.equal(fs.existsSync(path.join(baselineWorkspace.workspace, "commands")), false);
  assert.equal(fs.existsSync(path.join(baselineWorkspace.workspace, ".claude")), false);
  assert.equal(fs.existsSync(path.join(baselineWorkspace.workspace, ".codex-plugin")), false);
  assert.ok(fs.existsSync(baselineWorkspace.artifactDir));
} finally {
  cleanupCaseWorkspace(baselineWorkspace);
}
assert.equal(fs.existsSync(baselineWorkspace.tempRoot), false);

const judgeWorkspace = createJudgeWorkspace();
try {
  assert.notEqual(judgeWorkspace, root);
  assert.deepEqual(fs.readdirSync(judgeWorkspace), []);
} finally {
  cleanupJudgeWorkspace(judgeWorkspace);
}
assert.equal(fs.existsSync(judgeWorkspace), false);

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

}

main()
  .then(() => console.log("Live eval safety tests passed."))
  .catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
