#!/usr/bin/env node

const assert = require("assert/strict");
const { validateEvalData } = require("./eval-schema");

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
expectError(nullChecks, "checks[0] must be a non-empty string");

const numericTrace = clone(validCase());
numericTrace.traceExpectations = [123];
expectError(numericTrace, "traceExpectations[0] must be a non-empty string");

const emptyPrompt = clone(validCase());
emptyPrompt.positivePrompts[0] = "";
expectError(emptyPrompt, "positivePrompts[0] must be a non-empty string");

const duplicateIds = clone(validCase());
duplicateIds.cases.push(clone(duplicateIds.cases[0]));
expectError(duplicateIds, "id must be unique");

console.log("Eval schema tests passed.");
