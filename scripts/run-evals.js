#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const casesDir = path.join(root, "evals", "cases");
const fixturesDir = path.join(root, "evals", "fixtures");
const resultsDir = path.join(root, "evals", "results");
const skillRoot = path.join(root, "skills");
const errors = [];
const summaries = [];
const routingCollisions = [];
const routingMarginWarnings = [];
const negativeRoutingWarnings = [];
const ROUTING_MARGIN = 0.04;

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "before",
  "by",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "release",
  "review",
  "reviewing",
  "reviews",
  "skill",
  "skills",
  "the",
  "this",
  "to",
  "use",
  "when",
  "whether",
  "work",
  "with"
]);

function fail(message) {
  errors.push(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function skillExists(name) {
  return fs.existsSync(path.join(skillRoot, name, "SKILL.md"));
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function skillDescriptions() {
  if (!fs.existsSync(skillRoot)) {
    return [];
  }

  return fs
    .readdirSync(skillRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const file = path.join(skillRoot, entry.name, "SKILL.md");
      if (!fs.existsSync(file)) {
        return null;
      }
      const match = readText(file).match(/^description:\s*(.+)$/m);
      return match
        ? { skill: entry.name, description: stripQuotes(match[1]) }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.skill.localeCompare(b.skill));
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map(normalizeToken)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function normalizeToken(word) {
  if (word.length > 4 && word.endsWith("ies")) {
    return `${word.slice(0, -3)}y`;
  }
  if (word.length > 4 && /(ches|shes|sses|xes|zes)$/.test(word)) {
    return word.slice(0, -2);
  }
  if (word.length > 4 && word.endsWith("s")) {
    return word.slice(0, -1);
  }
  return word;
}

function termCounts(text) {
  const counts = new Map();
  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function buildIdf(docs) {
  const documentFrequency = new Map();
  for (const doc of docs) {
    for (const term of new Set(tokenize(doc))) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    }
  }

  const idf = new Map();
  for (const [term, count] of documentFrequency.entries()) {
    idf.set(term, Math.log((1 + docs.length) / (1 + count)) + 1);
  }
  return idf;
}

function vectorFor(text, idf) {
  const counts = termCounts(text);
  const vector = new Map();
  let total = 0;
  for (const count of counts.values()) {
    total += count;
  }
  if (total === 0) {
    return vector;
  }

  for (const [term, count] of counts.entries()) {
    const weight = (count / total) * (idf.get(term) || 1);
    vector.set(term, weight);
  }
  return vector;
}

function cosine(left, right) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (const value of left.values()) {
    leftNorm += value * value;
  }
  for (const value of right.values()) {
    rightNorm += value * value;
  }
  for (const [term, value] of left.entries()) {
    dot += value * (right.get(term) || 0);
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function routingIndex(descriptions) {
  const docs = descriptions.map((item) => item.description);
  const idf = buildIdf(docs);
  return descriptions.map((item) => ({
    ...item,
    vector: vectorFor(item.description, idf),
    idf
  }));
}

function rankPrompt(prompt, index) {
  if (index.length === 0) {
    return [];
  }
  const normalizedPrompt = normalizeText(prompt);
  const promptVector = vectorFor(prompt, index[0].idf);
  return index
    .map((item) => ({
      skill: item.skill,
      score: cosine(promptVector, item.vector) + exactSkillBoost(normalizedPrompt, item.skill)
    }))
    .sort((a, b) => b.score - a.score || a.skill.localeCompare(b.skill));
}

function normalizeText(text) {
  return ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
}

function exactSkillBoost(normalizedPrompt, skillName) {
  const normalizedSkill = ` ${skillName.replace(/-/g, " ")} `;
  return normalizedPrompt.includes(normalizedSkill) ? 1 : 0;
}

function topMatches(prompt, index) {
  return rankPrompt(prompt, index)
    .slice(0, 3)
    .map((item) => ({
      skill: item.skill,
      score: Number(item.score.toFixed(3))
    }));
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

function validateFixtureList(rel, item) {
  if (item.fixtures === undefined) {
    return 0;
  }
  if (!Array.isArray(item.fixtures)) {
    fail(`${rel}:${item.id}: fixtures must be an array of fixture file names`);
    return 0;
  }

  let count = 0;
  for (const fixture of item.fixtures) {
    if (typeof fixture !== "string" || !fixture.trim()) {
      fail(`${rel}:${item.id}: fixtures must contain non-empty file names`);
      continue;
    }
    if (path.isAbsolute(fixture) || fixture.includes("..")) {
      fail(`${rel}:${item.id}: fixture ${fixture} must stay inside evals/fixtures`);
      continue;
    }
    const full = path.join(fixturesDir, fixture);
    if (!full.startsWith(`${fixturesDir}${path.sep}`) || !fs.existsSync(full)) {
      fail(`${rel}:${item.id}: fixture ${fixture} does not exist`);
      continue;
    }
    count += 1;
  }
  return count;
}

function collectRoutingSignals(rel, data, routeIndex) {
  for (const prompt of data.positivePrompts || []) {
    const matches = topMatches(prompt, routeIndex);
    const top = matches[0];
    const runnerUp = matches[1];
    const narrowMargin = top && runnerUp ? top.score - runnerUp.score < ROUTING_MARGIN : false;
    if (!top || top.skill !== data.skill) {
      routingCollisions.push({
        file: rel,
        skill: data.skill,
        prompt,
        reason: !top
          ? "no route candidates"
          : "top description match differs from expected skill",
        matches
      });
    } else if (narrowMargin) {
      routingMarginWarnings.push({
        file: rel,
        skill: data.skill,
        prompt,
        reason: `top match margin below ${ROUTING_MARGIN}`,
        matches
      });
    }
  }

  for (const prompt of data.negativePrompts || []) {
    const matches = topMatches(prompt, routeIndex);
    if (matches[0] && matches[0].skill === data.skill) {
      negativeRoutingWarnings.push({
        file: rel,
        skill: data.skill,
        prompt,
        reason: "negative prompt still routes to this skill by description similarity",
        matches
      });
    }
  }
}

function validateCaseFile(file, routeIndex) {
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
  let fixtureReferences = 0;

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
  if (data.fixtures !== undefined) {
    fail(`${rel}: fixtures must be declared per case, not at the file top level`);
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
    fixtureReferences += validateFixtureList(rel, item);
  }

  collectRoutingSignals(rel, data, routeIndex);

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
    fixtureReferences,
    keywordRoutingSignal: positiveScore >= negativeScore ? "pass" : "review"
  });
}

function main() {
  const routeIndex = routingIndex(skillDescriptions());

  if (!fs.existsSync(casesDir)) {
    fail("evals/cases: missing");
  } else {
    for (const file of fs.readdirSync(casesDir).filter((name) => name.endsWith(".json"))) {
      validateCaseFile(path.join(casesDir, file), routeIndex);
    }
  }

  fs.mkdirSync(resultsDir, { recursive: true });
  if (routingCollisions.length > 0) {
    fail(`routing: ${routingCollisions.length} positive prompt(s) did not route clearly to their expected skill`);
  }

  const result = {
    generatedAt: new Date().toISOString(),
    status: errors.length === 0 ? "pass" : "fail",
    summaries,
    routingCollisionSummary: {
      thresholdMargin: ROUTING_MARGIN,
      positiveCollisionCount: routingCollisions.length,
      positiveMarginWarningCount: routingMarginWarnings.length,
      negativeWarningCount: negativeRoutingWarnings.length,
      positiveCollisions: routingCollisions.slice(0, 20),
      positiveMarginWarnings: routingMarginWarnings.slice(0, 20),
      negativeWarnings: negativeRoutingWarnings.slice(0, 20)
    },
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
