#!/usr/bin/env node

const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  cleanupCaseWorkspace,
  cleanupJudgeWorkspace,
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
try {
  assert.notEqual(caseWorkspace.workspace, root);
  assert.ok(fs.existsSync(path.join(caseWorkspace.workspace, "skills", "implement-change", "SKILL.md")));
  assert.equal(fs.existsSync(path.join(caseWorkspace.workspace, ".git")), false);
  assert.equal(fs.existsSync(path.join(caseWorkspace.workspace, "evals", "results")), false);

  const markerName = ".live-eval-isolation-marker";
  fs.writeFileSync(path.join(caseWorkspace.workspace, markerName), "isolated\n");
  assert.equal(fs.existsSync(path.join(root, markerName)), false);
} finally {
  cleanupCaseWorkspace(caseWorkspace);
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

console.log("Live eval safety tests passed.");
