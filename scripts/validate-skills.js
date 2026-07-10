#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { resolveFixtureFile } = require("./eval-files");
const { validateEvalCoverage, validateEvalData } = require("./eval-schema");

const root = process.cwd();
const skillRoot = path.join(root, "skills");
const commandRoot = path.join(root, "commands");
const fixturesRoot = path.join(root, "evals", "fixtures");
const DESCRIPTION_COLLISION_THRESHOLD = 0.75;
const allowedFrontmatterKeys = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools"
]);

const errors = [];
const skillDescriptions = [];
const descriptionStopWords = new Set([
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
  "including",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "this",
  "to",
  "use",
  "when",
  "with"
]);

function fail(message) {
  errors.push(message);
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function isKebabName(value) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) && value.length <= 64;
}

function parseFrontmatter(file, text) {
  if (!text.startsWith("---\n")) {
    fail(`${file}: missing opening frontmatter delimiter`);
    return null;
  }

  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    fail(`${file}: missing closing frontmatter delimiter`);
    return null;
  }

  const raw = text.slice(4, end).trim();
  const body = text.slice(end + 4).trim();
  const data = {};

  const lines = raw.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    if (/^\s/.test(line)) {
      fail(`${file}: indented frontmatter is only supported inside metadata or folded scalar values`);
      continue;
    }

    const match = line.match(/^([a-zA-Z0-9-]+):\s*(.*)$/);
    if (!match) {
      fail(`${file}: unsupported frontmatter line "${line}"`);
      continue;
    }
    const key = match[1];
    let value = match[2].trim();

    if (!allowedFrontmatterKeys.has(key)) {
      fail(`${file}: unknown frontmatter key "${key}"`);
    }

    const scalarMatch = value.match(/^([>|])[-+]?$/);
    if (scalarMatch) {
      const block = [];
      while (index + 1 < lines.length && (!lines[index + 1].trim() || /^\s+/.test(lines[index + 1]))) {
        index += 1;
        block.push(lines[index].replace(/^\s{2}/, ""));
      }
      data[key] = scalarMatch[1] === ">"
        ? block.join(" ").replace(/\s+/g, " ").trim()
        : block.join("\n").trim();
      continue;
    }

    if (value === "" && key === "metadata") {
      const metadata = {};
      while (index + 1 < lines.length && (!lines[index + 1].trim() || /^\s+/.test(lines[index + 1]))) {
        index += 1;
        const nested = lines[index];
        if (!nested.trim()) continue;
        const nestedMatch = nested.match(/^\s+([a-zA-Z0-9_.-]+):\s*(.*)$/);
        if (!nestedMatch) {
          fail(`${file}: unsupported metadata line "${nested}"`);
          continue;
        }
        metadata[nestedMatch[1]] = stripQuotes(nestedMatch[2].trim());
      }
      data[key] = metadata;
      continue;
    }

    if (value === "") {
      fail(`${file}: nested frontmatter is only supported for metadata; use a single-line value for ${key}`);
      continue;
    }

    value = stripQuotes(value);
    data[key] = value;
  }

  return { data, body };
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function descriptionTokens(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !descriptionStopWords.has(word));
}

function descriptionTermCounts(text) {
  const counts = new Map();
  for (const token of descriptionTokens(text)) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function descriptionIdf(docs) {
  const documentFrequency = new Map();
  for (const doc of docs) {
    for (const term of new Set(descriptionTokens(doc))) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    }
  }

  const idf = new Map();
  for (const [term, count] of documentFrequency.entries()) {
    idf.set(term, Math.log((1 + docs.length) / (1 + count)) + 1);
  }
  return idf;
}

function descriptionVector(text, idf) {
  const counts = descriptionTermCounts(text);
  const vector = new Map();
  let total = 0;
  for (const count of counts.values()) {
    total += count;
  }
  if (total === 0) {
    return vector;
  }

  for (const [term, count] of counts.entries()) {
    vector.set(term, (count / total) * (idf.get(term) || 1));
  }
  return vector;
}

function cosineSimilarity(left, right) {
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

function validateDescriptionCollisions() {
  if (skillDescriptions.length < 2) {
    return;
  }

  const idf = descriptionIdf(skillDescriptions.map((item) => item.description));
  const vectors = skillDescriptions.map((item) => ({
    ...item,
    vector: descriptionVector(item.description, idf)
  }));

  for (let leftIndex = 0; leftIndex < vectors.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < vectors.length; rightIndex += 1) {
      const left = vectors[leftIndex];
      const right = vectors[rightIndex];
      const score = cosineSimilarity(left.vector, right.vector);
      if (score >= DESCRIPTION_COLLISION_THRESHOLD) {
        fail(`${left.file} and ${right.file}: descriptions are too similar (${score.toFixed(2)} >= ${DESCRIPTION_COLLISION_THRESHOLD}); make trigger language more distinct`);
      }
    }
  }
}

function validateSkillDirectory(dirent) {
  if (!dirent.isDirectory()) return;

  const name = dirent.name;
  const dir = path.join(skillRoot, name);
  const relDir = path.relative(root, dir);
  const skillFile = path.join(dir, "SKILL.md");

  if (!isKebabName(name)) {
    fail(`${relDir}: skill directory must be kebab-case and <=64 characters`);
  }

  for (const readmeName of ["README.md", "readme.md"]) {
    if (fs.existsSync(path.join(dir, readmeName))) {
      fail(`${relDir}: per-skill README files are not allowed`);
    }
  }

  if (!fs.existsSync(skillFile)) {
    fail(`${relDir}: missing SKILL.md`);
    return;
  }

  const relFile = path.relative(root, skillFile);
  const text = readText(skillFile);
  const parsed = parseFrontmatter(relFile, text);
  if (!parsed) return;

  const { data, body } = parsed;
  if (body.includes("../../references/")) {
    fail(`${relFile}: do not depend on references outside the skill directory; inline essential checklist content`);
  }

  if (!data.name) {
    fail(`${relFile}: missing name`);
  } else {
    if (data.name !== name) {
      fail(`${relFile}: name must match parent directory`);
    }
    if (!isKebabName(data.name)) {
      fail(`${relFile}: name must be kebab-case and <=64 characters`);
    }
  }

  if (!data.description) {
    fail(`${relFile}: missing description`);
  } else {
    skillDescriptions.push({
      skill: name,
      file: relFile,
      description: data.description
    });
    if (data.description.length > 1024) {
      fail(`${relFile}: description exceeds 1024 characters`);
    }
    if (!/\bUse when\b/.test(data.description)) {
      fail(`${relFile}: description should include "Use when" trigger language`);
    }
    if (data.description.length < 80) {
      fail(`${relFile}: description is likely too generic`);
    }
  }

  if (!/^## Workflow$/m.test(body)) {
    fail(`${relFile}: missing "## Workflow" section`);
  }
  if (!/^## Output$/m.test(body)) {
    fail(`${relFile}: missing "## Output" section`);
  }

  const bodyLines = body.split("\n").length;
  if (bodyLines > 500) {
    fail(`${relFile}: body should stay under 500 lines`);
  }
}

function validateReferences() {
  const required = [
    "references/decision-rubric.md",
    "references/evidence-rubric.md",
    "references/product-architecture-security-rubric.md",
    "references/implementation-rubric.md",
    "references/review-rubric.md",
    "skills/compound-learning/references/observed-workflows.md"
  ];

  for (const rel of required) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) {
      fail(`${rel}: missing required reference`);
      continue;
    }
    if (!readText(file).trim()) {
      fail(`${rel}: reference is empty`);
    }
  }
}

function validateJsonFile(rel, requiredKeys = []) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    fail(`${rel}: missing`);
    return null;
  }

  let data;
  try {
    data = JSON.parse(readText(file));
  } catch (error) {
    fail(`${rel}: invalid JSON (${error.message})`);
    return null;
  }

  for (const key of requiredKeys) {
    if (data[key] === undefined || data[key] === "") {
      fail(`${rel}: missing ${key}`);
    }
  }

  return data;
}

function validateEvalFixtureList(rel, item) {
  if (item.fixtures === undefined) {
    return;
  }
  if (!Array.isArray(item.fixtures)) {
    fail(`${rel}:${item.id}: fixtures must be an array of fixture file names`);
    return;
  }

  for (const fixture of item.fixtures) {
    try {
      resolveFixtureFile(fixturesRoot, fixture);
    } catch (error) {
      fail(`${rel}:${item.id}: fixture ${error.message}`);
    }
  }
}

function validatePackageAndManifests() {
  const packageJson = validateJsonFile("package.json", ["name", "version", "description"]);
  if (packageJson && packageJson.name !== "engineering-judgment-skills") {
    fail("package.json: expected name engineering-judgment-skills");
  }

  const codex = validateJsonFile(".codex-plugin/plugin.json", [
    "name",
    "version",
    "description",
    "skills",
    "interface"
  ]);
  if (codex) {
    if (codex.name !== "engineering-judgment-skills") {
      fail(".codex-plugin/plugin.json: name must match package name");
    }
    if (codex.skills !== "./skills/") {
      fail(".codex-plugin/plugin.json: skills must point to ./skills/");
    }
    if (!codex.interface || !codex.interface.displayName) {
      fail(".codex-plugin/plugin.json: missing interface.displayName");
    }
    if (packageJson && codex.version !== packageJson.version) {
      fail(".codex-plugin/plugin.json: version must match package.json");
    }
  }

  const claude = validateJsonFile(".claude-plugin/plugin.json", [
    "name",
    "version",
    "description"
  ]);
  if (claude && claude.name !== "engineering-judgment-skills") {
    fail(".claude-plugin/plugin.json: name must match package name");
  }
  if (claude && packageJson && claude.version !== packageJson.version) {
    fail(".claude-plugin/plugin.json: version must match package.json");
  }

  validateJsonFile(".opencode/opencode.json", ["$schema"]);
  validateJsonFile(".pi/settings.json", ["skills"]);
  validateJsonFile(".pi/extensions/engineering-judgment-skills.json", ["name", "description", "skills"]);
}

function validateEvalCases() {
  const evalRoot = path.join(root, "evals", "cases");
  if (!fs.existsSync(evalRoot)) {
    fail("evals/cases: missing eval case directory");
    return;
  }

  const files = fs.readdirSync(evalRoot).filter((file) => file.endsWith(".json"));
  const datasets = [];
  let allSchemasValid = true;

  for (const file of files) {
    const rel = path.join("evals", "cases", file);
    const full = path.join(evalRoot, file);
    let data;
    try {
      data = JSON.parse(readText(full));
    } catch (error) {
      fail(`${rel}: invalid JSON (${error.message})`);
      allSchemasValid = false;
      continue;
    }

    const schemaErrors = validateEvalData(data);
    for (const error of schemaErrors) {
      fail(`${rel}: ${error}`);
    }
    if (schemaErrors.length > 0) {
      allSchemasValid = false;
      continue;
    }
    datasets.push({
      skill: data.skill,
      file: rel,
      expectedSkills: (data.negativeRoutes || []).map((route) => route.expectedSkill)
    });
    for (const item of data.cases) {
      validateEvalFixtureList(rel, item);
    }
  }

  if (allSchemasValid) {
    const skillNames = fs.existsSync(skillRoot)
      ? fs.readdirSync(skillRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
      : [];
    for (const error of validateEvalCoverage(skillNames, datasets)) {
      fail(`evals/cases: ${error}`);
    }
  }
}

function main() {
  if (!fs.existsSync(path.join(root, "README.md"))) {
    fail("README.md: missing repository README");
  }

  validatePackageAndManifests();

  if (!fs.existsSync(skillRoot)) {
    fail("skills: missing skills directory");
  } else {
    const dirents = fs.readdirSync(skillRoot, { withFileTypes: true });
    if (dirents.filter((dirent) => dirent.isDirectory()).length === 0) {
      fail("skills: no skill directories found");
    }
    for (const dirent of dirents) {
      validateSkillDirectory(dirent);
    }
    validateDescriptionCollisions();
  }

  if (!fs.existsSync(commandRoot)) {
    fail("commands: missing command directory");
  }

  validateReferences();
  validateEvalCases();

  if (errors.length > 0) {
    console.error("Skill validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Skill validation passed.");
}

main();
