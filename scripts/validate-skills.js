#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const skillRoot = path.join(root, "skills");
const commandRoot = path.join(root, "commands");
const allowedFrontmatterKeys = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools"
]);

const errors = [];

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
    "references/cto-decision-rubric.md",
    "references/evidence-rubric.md",
    "references/product-architecture-security-rubric.md",
    "references/implementation-rubric.md",
    "references/review-rubric.md",
    "references/observed-workflows.md"
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

function validatePackageAndManifests() {
  const packageJson = validateJsonFile("package.json", ["name", "version", "description"]);
  if (packageJson && packageJson.name !== "cto-agent-skills") {
    fail("package.json: expected name cto-agent-skills");
  }

  const codex = validateJsonFile(".codex-plugin/plugin.json", [
    "name",
    "version",
    "description",
    "skills",
    "interface"
  ]);
  if (codex) {
    if (codex.name !== "cto-agent-skills") {
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
  if (claude && claude.name !== "cto-agent-skills") {
    fail(".claude-plugin/plugin.json: name must match package name");
  }
  if (claude && packageJson && claude.version !== packageJson.version) {
    fail(".claude-plugin/plugin.json: version must match package.json");
  }

  validateJsonFile(".opencode/opencode.json", ["$schema"]);
  validateJsonFile(".pi/settings.json", ["skills"]);
  validateJsonFile(".pi/extensions/cto-agent-skills.json", ["name", "description", "skills"]);
}

function validateEvalCases() {
  const evalRoot = path.join(root, "evals", "cases");
  if (!fs.existsSync(evalRoot)) {
    fail("evals/cases: missing eval case directory");
    return;
  }

  const files = fs.readdirSync(evalRoot).filter((file) => file.endsWith(".json"));
  if (files.length === 0) {
    fail("evals/cases: no JSON cases found");
  }

  for (const file of files) {
    const rel = path.join("evals", "cases", file);
    const full = path.join(evalRoot, file);
    let data;
    try {
      data = JSON.parse(readText(full));
    } catch (error) {
      fail(`${rel}: invalid JSON (${error.message})`);
      continue;
    }

    if (!data.skill || typeof data.skill !== "string") {
      fail(`${rel}: missing string skill`);
    }
    if (!Array.isArray(data.cases) || data.cases.length === 0) {
      fail(`${rel}: cases must be a non-empty array`);
    }
    if (!Array.isArray(data.positivePrompts) || data.positivePrompts.length === 0) {
      fail(`${rel}: positivePrompts must be a non-empty array`);
    }
    if (!Array.isArray(data.negativePrompts) || data.negativePrompts.length === 0) {
      fail(`${rel}: negativePrompts must be a non-empty array`);
    }
    if (!Array.isArray(data.traceExpectations) || data.traceExpectations.length === 0) {
      fail(`${rel}: traceExpectations must be a non-empty array`);
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
