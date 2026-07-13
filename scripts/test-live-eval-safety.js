#!/usr/bin/env node

const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  cleanupCaseWorkspace,
  cleanupJudgeWorkspace,
  collectArtifacts,
  configureLimits,
  createCaseWorkspace,
  createJudgeWorkspace,
  resolveCommandOverride,
  runCommand
} = require("./run-live-evals");

const root = process.cwd();
assert.equal(resolveCommandOverride("codex"), "codex");
assert.equal(resolveCommandOverride("./scripts/mock-agent"), path.join(root, "scripts", "mock-agent"));

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
  const result = runCommand(
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
  const normalExitResult = runCommand(
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

const stdinResult = runCommand(
  {
    command: process.execPath,
    args: ["-e", "process.stdin.pipe(process.stdout)"],
    input: "prompt transported through stdin"
  },
  root
);
assert.equal(stdinResult.status, 0);
assert.equal(stdinResult.output, "prompt transported through stdin");

console.log("Live eval safety tests passed.");
