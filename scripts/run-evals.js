#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { resolveFixtureFile } = require("./eval-files");
const { validateEvalCoverage, validateEvalData } = require("./eval-schema");

const root = process.cwd();
const casesDir = path.join(root, "evals", "cases");
const fixturesDir = path.join(root, "evals", "fixtures");
const resultsDir = path.join(root, "evals", "results");
const skillRoot = path.join(root, "skills");
const errors = [];
const summaries = [];
const positiveRoutingDiagnostics = [];
const boundaryRoutingDiagnostics = [];
const routingMarginDiagnostics = [];
const negativeRoutingDiagnostics = [];
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

function installedSkillNames() {
  if (!fs.existsSync(skillRoot)) return [];
  return fs
    .readdirSync(skillRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(skillRoot, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
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
    try {
      resolveFixtureFile(fixturesDir, fixture);
    } catch (error) {
      fail(`${rel}:${item.id}: fixture ${error.message}`);
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
      positiveRoutingDiagnostics.push({
        file: rel,
        skill: data.skill,
        prompt,
        reason: !top
          ? "no route candidates"
          : "top description match differs from expected skill",
        matches
      });
    } else if (narrowMargin) {
      routingMarginDiagnostics.push({
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
      negativeRoutingDiagnostics.push({
        file: rel,
        skill: data.skill,
        prompt,
        reason: "negative prompt still routes to this skill by description similarity",
        matches
      });
    }
  }

  for (const route of data.negativeRoutes || []) {
    const matches = topMatches(route.prompt, routeIndex);
    const top = matches[0];
    const runnerUp = matches[1];
    const narrowMargin = top && runnerUp ? top.score - runnerUp.score < ROUTING_MARGIN : false;
    if (!top || top.skill !== route.expectedSkill) {
      boundaryRoutingDiagnostics.push({
        file: rel,
        skill: data.skill,
        expectedSkill: route.expectedSkill,
        prompt: route.prompt,
        reason: !top ? "no route candidates" : "boundary prompt routed to the wrong sibling skill",
        matches
      });
    } else if (narrowMargin) {
      routingMarginDiagnostics.push({
        file: rel,
        skill: route.expectedSkill,
        prompt: route.prompt,
        reason: `boundary match margin below ${ROUTING_MARGIN}`,
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

  const schemaErrors = validateEvalData(data);
  for (const error of schemaErrors) {
    fail(`${rel}: ${error}`);
  }
  if (schemaErrors.length > 0) {
    return;
  }

  if (!skillExists(data.skill)) {
    fail(`${rel}: skill ${data.skill} does not exist`);
  }

  const positivePrompts = data.positivePrompts;
  const negativePrompts = data.negativePrompts;
  const negativeRoutes = data.negativeRoutes || [];
  const cases = data.cases;
  const traceExpectations = data.traceExpectations;
  let fixtureReferences = 0;

  for (const item of cases) {
    fixtureReferences += validateFixtureList(rel, item);
  }

  collectRoutingSignals(rel, data, routeIndex);

  summaries.push({
    file: rel,
    skill: data.skill,
    positivePrompts: positivePrompts.length,
    negativePrompts: negativePrompts.length,
    boundaryPrompts: negativeRoutes.length,
    behavioralCases: cases.length,
    traceExpectations: traceExpectations.length,
    fixtureReferences
  });
  return {
    skill: data.skill,
    file: rel,
    expectedSkills: negativeRoutes.map((route) => route.expectedSkill)
  };
}

function formatMatches(matches) {
  return matches.map((match) => `${match.skill}=${match.score.toFixed(3)}`).join(", ");
}

function printRoutingDiagnostics() {
  const diagnosticCount =
    positiveRoutingDiagnostics.length
    + boundaryRoutingDiagnostics.length
    + routingMarginDiagnostics.length
    + negativeRoutingDiagnostics.length;
  if (diagnosticCount === 0) {
    return;
  }

  console.warn(
    "Routing diagnostics (non-blocking heuristic): "
      + `${positiveRoutingDiagnostics.length} positive mismatch(es), `
      + `${boundaryRoutingDiagnostics.length} boundary mismatch(es), `
      + `${routingMarginDiagnostics.length} narrow margin(s), `
      + `${negativeRoutingDiagnostics.length} negative prompt match(es).`
  );
  for (const diagnostic of positiveRoutingDiagnostics) {
    console.warn(`- positive ${diagnostic.file}: ${JSON.stringify(diagnostic.prompt)} -> ${formatMatches(diagnostic.matches)}`);
  }
  for (const diagnostic of boundaryRoutingDiagnostics) {
    console.warn(`- boundary ${diagnostic.file}: ${JSON.stringify(diagnostic.prompt)} -> ${formatMatches(diagnostic.matches)}`);
  }
  for (const diagnostic of routingMarginDiagnostics) {
    console.warn(`- margin ${diagnostic.file}: ${JSON.stringify(diagnostic.prompt)} -> ${formatMatches(diagnostic.matches)}`);
  }
  for (const diagnostic of negativeRoutingDiagnostics) {
    console.warn(`- negative ${diagnostic.file}: ${JSON.stringify(diagnostic.prompt)} -> ${formatMatches(diagnostic.matches)}`);
  }
}

function main() {
  const routeIndex = routingIndex(skillDescriptions());

  if (!fs.existsSync(casesDir)) {
    fail("evals/cases: missing");
  } else {
    const files = fs.readdirSync(casesDir).filter((name) => name.endsWith(".json"));
    const datasets = [];
    for (const file of files) {
      const dataset = validateCaseFile(path.join(casesDir, file), routeIndex);
      if (dataset) datasets.push(dataset);
    }
    if (datasets.length === files.length) {
      for (const error of validateEvalCoverage(installedSkillNames(), datasets)) {
        fail(`evals/cases: ${error}`);
      }
    }
  }

  fs.mkdirSync(resultsDir, { recursive: true });
  const routingDiagnosticCount =
    positiveRoutingDiagnostics.length
    + boundaryRoutingDiagnostics.length
    + routingMarginDiagnostics.length
    + negativeRoutingDiagnostics.length;

  const result = {
    generatedAt: new Date().toISOString(),
    status: errors.length === 0 ? "pass" : "fail",
    summaries,
    routingDiagnosticSummary: {
      status: routingDiagnosticCount === 0 ? "clear" : "review",
      nonBlocking: true,
      thresholdMargin: ROUTING_MARGIN,
      positiveMismatchCount: positiveRoutingDiagnostics.length,
      boundaryMismatchCount: boundaryRoutingDiagnostics.length,
      narrowMarginCount: routingMarginDiagnostics.length,
      negativeMatchCount: negativeRoutingDiagnostics.length,
      positiveMismatches: positiveRoutingDiagnostics.slice(0, 20),
      boundaryMismatches: boundaryRoutingDiagnostics.slice(0, 20),
      narrowMargins: routingMarginDiagnostics.slice(0, 20),
      negativeMatches: negativeRoutingDiagnostics.slice(0, 20)
    },
    errors
  };
  fs.writeFileSync(path.join(resultsDir, "latest.json"), `${JSON.stringify(result, null, 2)}\n`);
  printRoutingDiagnostics();

  if (errors.length > 0) {
    console.error("Routing diagnostic validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Routing diagnostics completed for ${summaries.length} case files; heuristic mismatches are non-blocking.`);
}

main();
