#!/usr/bin/env node

const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();

function copyFilter(source) {
  const rel = path.relative(root, source);
  if (!rel) return true;
  const parts = rel.split(path.sep);
  if (parts[0] === ".git" || parts[0] === "node_modules") return false;
  if (parts[0] === "evals" && parts[1] === "results") return false;
  return true;
}

function createRepo() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-eval-entrypoints-"));
  const repo = path.join(tempRoot, "repo");
  fs.cpSync(root, repo, { recursive: true, filter: copyFilter });
  return { repo, tempRoot };
}

function run(repo, script, env = {}) {
  const result = spawnSync(process.execPath, [script], {
    cwd: repo,
    encoding: "utf8",
    timeout: 10000,
    env: { ...process.env, ...env }
  });
  return {
    output: `${result.stdout || ""}\n${result.stderr || ""}`,
    status: result.status === null ? 1 : result.status
  };
}

function expectFailure(result, fragment, label) {
  assert.notEqual(result.status, 0, `${label} unexpectedly passed`);
  assert.ok(result.output.includes(fragment), `${label} did not include ${JSON.stringify(fragment)}:\n${result.output}`);
}

function casePath(repo, name) {
  return path.join(repo, "evals", "cases", name);
}

const entrypoints = [
  { label: "validator", script: "scripts/validate-skills.js", env: {} },
  { label: "static", script: "scripts/run-evals.js", env: {} },
  {
    label: "live",
    script: "scripts/run-live-evals.js",
    env: {
      LIVE_EVAL_COMMAND: process.execPath,
      LIVE_EVAL_MAX_FIXTURE_BYTES: "1048576",
      LIVE_EVAL_TIMEOUT_MS: "1000"
    }
  }
];

const coverageScenarios = [
  {
    name: "missing",
    expected: "skill architecture-review is missing an eval dataset",
    mutate(repo) {
      fs.unlinkSync(casePath(repo, "architecture-review.json"));
    }
  },
  {
    name: "duplicate",
    expected: "skill architecture-review has duplicate eval datasets",
    mutate(repo) {
      fs.copyFileSync(casePath(repo, "architecture-review.json"), casePath(repo, "architecture-review-copy.json"));
    }
  },
  {
    name: "unknown",
    expected: "skill unknown-skill has no matching skill directory",
    mutate(repo) {
      const file = casePath(repo, "architecture-review.json");
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      data.skill = "unknown-skill";
      for (const item of data.cases) item.expectedSkill = "unknown-skill";
      fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
    }
  },
  {
    name: "unknown-boundary-target",
    expected: "boundary target unknown-skill has no matching skill directory",
    mutate(repo) {
      const file = casePath(repo, "to-spec.json");
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      data.negativeRoutes[0].expectedSkill = "unknown-skill";
      fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
    }
  },
  {
    name: "zero",
    expected: "found none",
    mutate(repo) {
      for (const file of fs.readdirSync(path.join(repo, "evals", "cases"))) {
        if (file.endsWith(".json")) fs.unlinkSync(casePath(repo, file));
      }
    }
  }
];

for (const scenario of coverageScenarios) {
  const temp = createRepo();
  try {
    scenario.mutate(temp.repo);
    for (const entrypoint of entrypoints) {
      const result = run(temp.repo, entrypoint.script, entrypoint.env);
      expectFailure(result, scenario.expected, `${scenario.name}/${entrypoint.label}`);
    }
  } finally {
    fs.rmSync(temp.tempRoot, { recursive: true, force: true });
  }
}

for (const scenario of ["malformed", "missing-directory"]) {
  const temp = createRepo();
  try {
    if (scenario === "malformed") {
      fs.writeFileSync(casePath(temp.repo, "architecture-review.json"), "{\n");
    } else {
      fs.renameSync(path.join(temp.repo, "evals", "cases"), path.join(temp.repo, "evals", "cases-missing"));
    }
    const result = run(temp.repo, "scripts/run-live-evals.js", entrypoints[2].env);
    expectFailure(result, "Live eval case validation failed:", `live/${scenario}`);
    expectFailure(result, scenario === "malformed" ? "invalid JSON" : "evals/cases: missing", `live/${scenario}`);
  } finally {
    fs.rmSync(temp.tempRoot, { recursive: true, force: true });
  }
}

const routingTemp = createRepo();
try {
  const file = casePath(routingTemp.repo, "to-spec.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  data.negativePrompts = [
    "Use to-spec for this request.",
    "Create a to-spec artifact now."
  ];
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  const result = run(routingTemp.repo, "scripts/run-evals.js");
  expectFailure(result, "negative prompt(s) still routed", "routing/negative-boundary");
} finally {
  fs.rmSync(routingTemp.tempRoot, { recursive: true, force: true });
}

const boundaryTemp = createRepo();
try {
  const file = casePath(boundaryTemp.repo, "to-spec.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  data.negativeRoutes[0].expectedSkill = "architecture-review";
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  const result = run(boundaryTemp.repo, "scripts/run-evals.js");
  expectFailure(result, "boundary prompt(s) did not route", "routing/expected-sibling");
} finally {
  fs.rmSync(boundaryTemp.tempRoot, { recursive: true, force: true });
}

console.log("Eval entrypoint integration tests passed.");
