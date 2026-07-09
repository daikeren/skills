#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const casesDir = path.join(root, "evals", "cases");
const resultsDir = path.join(root, "evals", "results");
const skillRoot = path.join(root, "skills");
const errors = [];
const summaries = [];

function fail(message) {
  errors.push(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function skillExists(name) {
  return fs.existsSync(path.join(skillRoot, name, "SKILL.md"));
}

function scorePromptForSkill(prompt, skillName) {
  const words = new Set(
    prompt
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  );
  const skillTokens = skillName.split("-");
  return skillTokens.filter((token) => words.has(token)).length;
}

function validateCaseFile(file) {
  const rel = path.relative(root, file);
  let data;
  try {
    data = readJson(file);
  } catch (error) {
    fail(`${rel}: invalid JSON (${error.message})`);
    return;
  }

  if (!skillExists(data.skill)) {
    fail(`${rel}: skill ${data.skill} does not exist`);
  }

  const positivePrompts = data.positivePrompts || [];
  const negativePrompts = data.negativePrompts || [];
  const cases = data.cases || [];
  const traceExpectations = data.traceExpectations || [];

  if (positivePrompts.length < 2) {
    fail(`${rel}: expected at least two positive prompts`);
  }
  if (negativePrompts.length < 2) {
    fail(`${rel}: expected at least two negative prompts`);
  }
  if (cases.length === 0) {
    fail(`${rel}: expected behavioral cases`);
  }
  if (traceExpectations.length === 0) {
    fail(`${rel}: expected trace expectations`);
  }

  for (const item of cases) {
    if (!item.id || !item.prompt || !item.expectedSkill) {
      fail(`${rel}: each case needs id, prompt, and expectedSkill`);
      continue;
    }
    if (item.expectedSkill !== data.skill) {
      fail(`${rel}:${item.id}: expectedSkill must match top-level skill`);
    }
    if (!Array.isArray(item.checks) || item.checks.length < 2) {
      fail(`${rel}:${item.id}: checks must include at least two expectations`);
    }
  }

  const positiveScore = positivePrompts.reduce(
    (sum, prompt) => sum + scorePromptForSkill(prompt, data.skill),
    0
  );
  const negativeScore = negativePrompts.reduce(
    (sum, prompt) => sum + scorePromptForSkill(prompt, data.skill),
    0
  );

  summaries.push({
    file: rel,
    skill: data.skill,
    positivePrompts: positivePrompts.length,
    negativePrompts: negativePrompts.length,
    behavioralCases: cases.length,
    traceExpectations: traceExpectations.length,
    keywordRoutingSignal: positiveScore >= negativeScore ? "pass" : "review"
  });
}

function main() {
  if (!fs.existsSync(casesDir)) {
    fail("evals/cases: missing");
  } else {
    for (const file of fs.readdirSync(casesDir).filter((name) => name.endsWith(".json"))) {
      validateCaseFile(path.join(casesDir, file));
    }
  }

  fs.mkdirSync(resultsDir, { recursive: true });
  const result = {
    generatedAt: new Date().toISOString(),
    status: errors.length === 0 ? "pass" : "fail",
    summaries,
    errors
  };
  fs.writeFileSync(path.join(resultsDir, "latest.json"), `${JSON.stringify(result, null, 2)}\n`);

  if (errors.length > 0) {
    console.error("Eval sanity checks failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Eval sanity checks passed for ${summaries.length} case files.`);
}

main();
