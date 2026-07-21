#!/usr/bin/env node

const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const {
  cleanupActiveTemporaryResources,
  cleanupCaseWorkspace,
  cleanupJudgeWorkspace,
  cleanupTemporaryCodexHome,
  collectArtifacts,
  configureLimits,
  createCaseWorkspace,
  createJudgeWorkspace,
  createTemporaryCodexHome,
  evidenceAppearsInOutput,
  evidenceList,
  installSignalCleanup,
  parseCaseFilter,
  resolveCommandOverride,
  runCommand,
  selectCases,
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
assert.deepEqual(evidenceList("“exact runtime output”"), ["exact runtime output"]);
assert.deepEqual(evidenceList(["\"first quote\"", "second quote"]), ["first quote", "second quote"]);
assert.equal(evidenceAppearsInOutput("Exact runtime\noutput", ["Exact runtime\noutput"]), true);
assert.equal(evidenceAppearsInOutput("Exact runtime\noutput", ["exact runtime\noutput"]), false);
assert.equal(evidenceAppearsInOutput("Exact runtime\noutput", ["Exact runtime output"]), false);

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
  mainRunnerWorkspace = createCaseWorkspace();
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

const caseWorkspace = createCaseWorkspace();
let externalArtifactTarget;
try {
  assert.notEqual(caseWorkspace.workspace, root);
  assert.equal(path.dirname(caseWorkspace.workspace), caseWorkspace.tempRoot);
  assert.equal(path.dirname(caseWorkspace.artifactDir), caseWorkspace.tempRoot);
  assert.notEqual(caseWorkspace.artifactDir, caseWorkspace.workspace);
  assert.ok(fs.existsSync(caseWorkspace.artifactDir));
  assert.ok(fs.existsSync(path.join(caseWorkspace.workspace, "skills", "implement-change", "SKILL.md")));
  assert.equal(fs.existsSync(path.join(caseWorkspace.workspace, ".git")), false);
  assert.equal(fs.existsSync(path.join(caseWorkspace.workspace, "evals", "results")), false);

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
