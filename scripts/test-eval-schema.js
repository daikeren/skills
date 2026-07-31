#!/usr/bin/env node

const assert = require("assert/strict");
const { validateEvalCoverage, validateEvalData } = require("./eval-schema");

function validCase() {
  return {
    skill: "example-skill",
    version: 1,
    purpose: "Exercise the shared eval schema.",
    positivePrompts: ["Use example-skill for this task.", "Run the example workflow."],
    negativePrompts: ["Use another skill.", "Only summarize the input."],
    cases: [
      {
        id: "example",
        prompt: "Complete the example task.",
        expectedSkill: "example-skill",
        checks: ["Returns a result.", "Includes evidence."],
        fixtures: ["sample.md"]
      }
    ],
    traceExpectations: ["The expected workflow is visible."]
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function expectError(data, fragment) {
  const errors = validateEvalData(data);
  assert.ok(errors.some((error) => error.includes(fragment)), `expected error containing "${fragment}", got ${errors.join("; ")}`);
}

assert.deepEqual(validateEvalData(validCase()), []);

const nullChecks = clone(validCase());
nullChecks.cases[0].checks = [null, null];
expectError(nullChecks, "checks[0] must be a non-empty string or expectation object");

const numericTrace = clone(validCase());
numericTrace.traceExpectations = [123];
expectError(numericTrace, "traceExpectations[0] must be a non-empty string or expectation object");

const explicitNotApplicable = clone(validCase());
explicitNotApplicable.traceExpectations = [
  { text: "When HTML is chosen, validate it.", allowsNotApplicable: true }
];
assert.deepEqual(validateEvalData(explicitNotApplicable), []);

const bypassCase = clone(validCase());
bypassCase.cases[0].applicability = "bypass";
assert.deepEqual(validateEvalData(bypassCase), []);

const invalidApplicability = clone(validCase());
invalidApplicability.cases[0].applicability = "always-run";
expectError(invalidApplicability, "applicability must be use, bypass, or avoid-extra-process");

const workspaceFixtures = clone(validCase());
workspaceFixtures.cases[0].fixturePresentation = "workspace";
assert.deepEqual(validateEvalData(workspaceFixtures), []);

const invalidFixturePresentation = clone(validCase());
invalidFixturePresentation.cases[0].fixturePresentation = "hidden";
expectError(invalidFixturePresentation, "fixturePresentation must be inline or workspace");

const workspaceWithoutFixtures = clone(workspaceFixtures);
delete workspaceWithoutFixtures.cases[0].fixtures;
expectError(workspaceWithoutFixtures, "fixtures must be present when fixturePresentation is workspace");

const invalidExpectationObject = clone(explicitNotApplicable);
invalidExpectationObject.traceExpectations[0].allowsNotApplicable = "yes";
expectError(invalidExpectationObject, "allowsNotApplicable must be a boolean");

const emptyPrompt = clone(validCase());
emptyPrompt.positivePrompts[0] = "";
expectError(emptyPrompt, "positivePrompts[0] must be a non-empty string");

const duplicateIds = clone(validCase());
duplicateIds.cases.push(clone(duplicateIds.cases[0]));
expectError(duplicateIds, "id must be unique");

const invalidCaseId = clone(validCase());
invalidCaseId.cases[0].id = "not_selectable";
expectError(invalidCaseId, "id must be kebab-case");

const pairedRoutes = clone(validCase());
pairedRoutes.negativePrompts = [];
pairedRoutes.negativeRoutes = [
  { prompt: "Use alpha instead.", expectedSkill: "alpha" },
  { prompt: "Use beta instead.", expectedSkill: "beta" }
];
assert.deepEqual(validateEvalData(pairedRoutes), []);

const selfRoute = clone(pairedRoutes);
selfRoute.negativeRoutes[0].expectedSkill = "example-skill";
expectError(selfRoute, "expectedSkill must differ");

const coverage = [
  { skill: "alpha", file: "evals/cases/alpha.json" },
  { skill: "beta", file: "evals/cases/beta.json" }
];
assert.deepEqual(validateEvalCoverage(["alpha", "beta"], coverage), []);
assert.match(validateEvalCoverage(["alpha"], [])[0], /found none/);
assert.ok(validateEvalCoverage(["alpha", "beta"], coverage.slice(0, 1)).some((error) => error.includes("beta is missing")));
assert.ok(validateEvalCoverage(["alpha"], [...coverage.slice(0, 1), coverage[0]]).some((error) => error.includes("duplicate")));
assert.ok(validateEvalCoverage(["alpha"], [{ skill: "unknown", file: "unknown.json" }]).some((error) => error.includes("no matching skill directory")));
assert.ok(validateEvalCoverage(["alpha"], [{ skill: "alpha", file: "alpha.json", expectedSkills: ["unknown"] }]).some((error) => error.includes("boundary target")));

console.log("Eval schema tests passed.");
