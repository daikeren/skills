#!/usr/bin/env node

const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  loadBenchmarkWorkspace,
  validateBenchmarkManifest,
  validateMaterializedWorkspaceLeakage,
  validateOracle
} = require("./eval-benchmark");

function datasetsAt(root) {
  const directory = path.join(root, "evals", "cases");
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => ({
      file: path.join("evals", "cases", name),
      data: JSON.parse(fs.readFileSync(path.join(directory, name), "utf8"))
    }));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const root = path.resolve(__dirname, "..");
const datasets = datasetsAt(root);
const workspace = loadBenchmarkWorkspace(root, datasets);
assert.equal(workspace.manifest.status, "draft");
assert.equal(workspace.manifest.entries.length, 2);
assert.equal(workspace.oraclesByCase.size, 2);
assert.deepEqual(
  [...workspace.oraclesByCase.keys()].sort(),
  ["review-code/deployment-policy-bound", "review-code/deployment-policy-bypass"]
);

const reviewCode = datasets.find(({ data }) => data.skill === "review-code").data;
const reviewContractText = [
  ...reviewCode.cases.flatMap(({ checks }) => checks.map((check) => (
    typeof check === "string" ? check : check.text
  ))),
  ...reviewCode.traceExpectations.map((expectation) => (
    typeof expectation === "string" ? expectation : expectation.text
  ))
].join("\n");
assert.doesNotMatch(
  reviewContractText,
  /for a non-trivial review|uses parallel subagents|isolated-pass fallback|names an isolated-pass fallback/i
);
assert.match(
  reviewContractText,
  /broad multi-surface review[\s\S]*integrated into one findings-first verdict[\s\S]*process telemetry remains unknown/i
);
const deploymentPositive = reviewCode.cases.find(({ id }) => id === "deployment-policy-bypass");
const deploymentClean = reviewCode.cases.find(({ id }) => id === "deployment-policy-bound");
assert.equal(deploymentPositive.prompt, deploymentClean.prompt);
assert.equal(deploymentPositive.fixturePresentation, "workspace");
assert.equal(deploymentClean.fixturePresentation, "workspace");
assert.deepEqual(deploymentPositive.fixtures.slice(0, 3), deploymentClean.fixtures.slice(0, 3));
assert.equal(deploymentPositive.fixtures.at(-1), deploymentClean.fixtures.at(-1));
assert.notEqual(deploymentPositive.fixtures[3], deploymentClean.fixtures[3]);
assert.doesNotMatch(
  `${deploymentPositive.fixtures[3]} ${deploymentClean.fixtures[3]}`,
  /clean|control|defect|negative|positive|regression/i
);

const frozen = clone(workspace.manifest);
frozen.status = "frozen";
const frozenErrors = validateBenchmarkManifest(frozen, datasets, { root });
assert.ok(frozenErrors.some((error) => error.includes("needs a positive case")));
assert.ok(frozenErrors.some((error) => error.includes("needs a bypass or negative case")));

const positiveOracle = JSON.parse(fs.readFileSync(
  path.join(root, "evals", "oracles", "review-code", "deployment-policy-bypass.json"),
  "utf8"
));
assert.deepEqual(validateOracle(positiveOracle, positiveOracle.id), []);
assert.equal(positiveOracle.materialFindings[0].id, "unchecked-deployment-policy-bypass");
const invalidOracle = clone(positiveOracle);
invalidOracle.materialFindings[0].reachability = ["one step only"];
assert.ok(validateOracle(invalidOracle, invalidOracle.id).some((error) => error.includes("at least 2")));

const cleanOracle = JSON.parse(fs.readFileSync(
  path.join(root, "evals", "oracles", "review-code", "deployment-policy-bound.json"),
  "utf8"
));
assert.deepEqual(validateOracle(cleanOracle, cleanOracle.id), []);
assert.equal(cleanOracle.materialFindings.length, 0);
assert.match(cleanOracle.cleanControls.join(" "), /authoritative validation boundary/);
const contaminatedCleanOracle = clone(cleanOracle);
contaminatedCleanOracle.materialFindings.push(clone(positiveOracle.materialFindings[0]));
assert.ok(validateOracle(contaminatedCleanOracle, cleanOracle.id)
  .some((error) => error.includes("must be empty for no-material-findings")));

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-benchmark-"));
try {
  fs.mkdirSync(path.join(tempRoot, "evals", "cases"), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, "evals", "fixtures"), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, "evals", "oracles", "example"), { recursive: true });
  const guardedText = "A hidden clearing defect is reachable.";
  const leakyOracle = {
    schemaVersion: 1,
    id: "example/leaky",
    independence: "Derived before the response.",
    invariant: "Only the current episode can clear.",
    expectedOutcome: "material-findings",
    leakageGuards: [guardedText],
    materialFindings: [{
      id: "finding",
      impact: "Wrong state.",
      reachability: ["First event.", "Second event."],
      evidence: ["code path"]
    }]
  };
  fs.writeFileSync(
    path.join(tempRoot, "evals", "oracles", "example", "leaky.json"),
    `${JSON.stringify(leakyOracle, null, 2)}\n`
  );
  const leakyDatasets = [{
    file: "evals/cases/example.json",
    data: {
      skill: "example",
      cases: [{ id: "leaky", prompt: "Review the patch.", fixtures: ["leaky.md"] }]
    }
  }];
  fs.writeFileSync(
    path.join(tempRoot, "evals", "cases", "example.json"),
    `${JSON.stringify(leakyDatasets[0].data, null, 2)}\n`
  );
  const leakyManifest = {
    schemaVersion: 1,
    id: "example",
    version: "draft-1",
    status: "draft",
    scope: "Leakage test.",
    primaryBaseline: { kind: "same-goal-terse", id: "terse-v1" },
    entries: [{
      skill: "example",
      case: "leaky",
      disposition: "adapt",
      role: "positive",
      readiness: "ready",
      rationale: "Test the hidden defect.",
      source: {
        kind: "seeded-control",
        origin: "test",
        license: "MIT",
        baseRevision: "v1",
        contaminationRisk: "unknown",
        intendedTaskDistribution: "test"
      },
      oracle: "example/leaky.json"
    }]
  };

  fs.writeFileSync(path.join(tempRoot, "evals", "fixtures", "leaky.md"), `${guardedText}\n`);
  assert.ok(validateBenchmarkManifest(leakyManifest, leakyDatasets, { root: tempRoot })
    .some((error) => error.includes("leaks oracle guard")));

  fs.writeFileSync(path.join(tempRoot, "evals", "fixtures", "leaky.md"), "Neutral patch contents.\n");
  fs.writeFileSync(path.join(tempRoot, "package.json"), `${JSON.stringify({ files: ["scripts/"] })}\n`);
  fs.mkdirSync(path.join(tempRoot, "scripts"));
  fs.writeFileSync(path.join(tempRoot, "scripts", "test-eval-hidden.js"), `${guardedText}\n`);
  assert.equal(
    validateBenchmarkManifest(leakyManifest, leakyDatasets, { root: tempRoot })
      .some((error) => error.includes("leaks oracle guard")),
    false,
    "evaluator-owned scripts are not candidate-visible leakage"
  );

  const productFile = path.join(tempRoot, "scripts", "product-data.bin");
  fs.writeFileSync(productFile, Buffer.concat([Buffer.from([0, 255, 0]), Buffer.from(guardedText)]));
  assert.ok(validateBenchmarkManifest(leakyManifest, leakyDatasets, { root: tempRoot })
    .some((error) => error.includes("leaks oracle guard")), "NUL-bearing files are scanned as raw bytes");
  fs.writeFileSync(productFile, Buffer.from([0, 255, 0]));

  const guardedDirectory = path.join(tempRoot, "scripts", guardedText);
  fs.mkdirSync(guardedDirectory);
  assert.ok(validateBenchmarkManifest(leakyManifest, leakyDatasets, { root: tempRoot })
    .some((error) => error.includes("leaks oracle guard")), "candidate-visible directory paths are scanned");
  fs.rmdirSync(guardedDirectory);

  const materialized = path.join(tempRoot, "materialized");
  fs.mkdirSync(materialized);
  const leakageOracles = new Map([["example/leaky", { data: leakyOracle }]]);
  assert.deepEqual(validateMaterializedWorkspaceLeakage(materialized, "Review the patch.", leakageOracles), []);
  assert.ok(validateMaterializedWorkspaceLeakage(
    materialized,
    `Injected skill text: ${guardedText}`,
    leakageOracles
  ).some((error) => error.includes("leaks example/leaky oracle guard")));

  const outsideOracle = path.join(tempRoot, "outside-oracle.json");
  fs.writeFileSync(outsideOracle, `${JSON.stringify(leakyOracle)}\n`);
  const oracleLink = path.join(tempRoot, "evals", "oracles", "example", "escape.json");
  try {
    fs.symlinkSync(outsideOracle, oracleLink);
    const escaped = clone(leakyManifest);
    escaped.entries[0].oracle = "example/escape.json";
    assert.ok(validateBenchmarkManifest(escaped, leakyDatasets, { root: tempRoot })
      .some((error) => error.includes("non-symbolic-link")));
  } catch (error) {
    if (!error || !["EPERM", "EACCES"].includes(error.code)) throw error;
  }
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log("Representative benchmark tests passed.");
