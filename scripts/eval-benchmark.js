"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { DEFAULT_MAX_FIXTURE_BYTES, resolveFixtureFile } = require("./eval-files");
const { isNonEmptyString } = require("./eval-schema");
const { isEvaluatorOwnedPath } = require("./eval-surface-policy");

const DISPOSITIONS = new Set(["keep", "adapt", "replace", "retire"]);
const ROLES = new Set(["positive", "bypass", "negative", "boundary", "control"]);
const READINESS = new Set(["planned", "ready", "quarantined"]);
const CONTAMINATION_RISKS = new Set(["low", "medium", "high", "unknown"]);
const EXPECTED_OUTCOMES = new Set(["material-findings", "no-material-findings"]);
const VERDICT_BEARING_FIXTURE_NAME = /(?:^|[-_.])(clean|control|defect|negative|positive|regression)(?:[-_.]|$)/i;
const CANDIDATE_EXCLUDED_TOP_LEVEL = new Set([
  "skills",
  "commands",
  ".codex-plugin",
  ".claude-plugin",
  ".claude",
  ".opencode",
  ".pi"
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function caseIndex(datasets) {
  const index = new Map();
  for (const dataset of datasets) {
    for (const item of dataset.data.cases || []) {
      index.set(`${dataset.data.skill}/${item.id}`, { data: dataset.data, item });
    }
  }
  return index;
}

function validateStringArray(errors, value, field, minimum = 1) {
  if (!Array.isArray(value) || value.length < minimum) {
    errors.push(`${field} must contain at least ${minimum} non-empty string(s)`);
    return;
  }
  value.forEach((item, index) => {
    if (!isNonEmptyString(item)) errors.push(`${field}[${index}] must be a non-empty string`);
  });
}

function validateOracle(oracle, expectedId) {
  const errors = [];
  if (!isObject(oracle)) return ["oracle must be an object"];
  if (oracle.schemaVersion !== 1) errors.push("oracle.schemaVersion must be 1");
  if (oracle.id !== expectedId) errors.push(`oracle.id must equal ${expectedId}`);
  if (!isNonEmptyString(oracle.independence)) errors.push("oracle.independence must be a non-empty string");
  if (!isNonEmptyString(oracle.invariant)) errors.push("oracle.invariant must be a non-empty string");
  if (!EXPECTED_OUTCOMES.has(oracle.expectedOutcome)) {
    errors.push("oracle.expectedOutcome must be material-findings or no-material-findings");
  }
  validateStringArray(errors, oracle.leakageGuards, "oracle.leakageGuards");
  if (!Array.isArray(oracle.materialFindings)) {
    errors.push("oracle.materialFindings must be an array");
  } else {
    if (oracle.expectedOutcome === "material-findings" && oracle.materialFindings.length === 0) {
      errors.push("oracle.materialFindings must contain at least one finding for material-findings");
    }
    if (oracle.expectedOutcome === "no-material-findings" && oracle.materialFindings.length > 0) {
      errors.push("oracle.materialFindings must be empty for no-material-findings");
    }
    const ids = new Set();
    oracle.materialFindings.forEach((finding, index) => {
      const prefix = `oracle.materialFindings[${index}]`;
      if (!isObject(finding)) {
        errors.push(`${prefix} must be an object`);
        return;
      }
      if (!isNonEmptyString(finding.id)) errors.push(`${prefix}.id must be a non-empty string`);
      else if (ids.has(finding.id)) errors.push(`${prefix}.id must be unique`);
      else ids.add(finding.id);
      if (!isNonEmptyString(finding.impact)) errors.push(`${prefix}.impact must be a non-empty string`);
      validateStringArray(errors, finding.reachability, `${prefix}.reachability`, 2);
      validateStringArray(errors, finding.evidence, `${prefix}.evidence`);
    });
  }
  if (oracle.expectedOutcome === "no-material-findings" && oracle.cleanControls === undefined) {
    errors.push("oracle.cleanControls must be present for no-material-findings");
  } else if (oracle.cleanControls !== undefined) {
    validateStringArray(errors, oracle.cleanControls, "oracle.cleanControls");
  }
  return errors;
}

function validateSource(errors, source, prefix) {
  if (!isObject(source)) {
    errors.push(`${prefix}.source must be an object for a ready case`);
    return;
  }
  for (const field of ["kind", "origin", "license", "baseRevision", "intendedTaskDistribution"]) {
    if (!isNonEmptyString(source[field])) errors.push(`${prefix}.source.${field} must be a non-empty string`);
  }
  if (!CONTAMINATION_RISKS.has(source.contaminationRisk)) {
    errors.push(`${prefix}.source.contaminationRisk must be low, medium, high, or unknown`);
  }
}

function normalized(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function candidateVisibleRepositoryParts(root) {
  let packageFiles = [];
  try {
    packageFiles = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).files || [];
  } catch (_error) {
    // A bounded fixture-only validation root need not be a package workspace.
  }
  const topLevel = new Set([
    "package.json",
    "AGENTS.md",
    ".gitignore",
    ".github",
    ...packageFiles.map((entry) => entry.split("/")[0]).filter(Boolean)
  ]);
  const textParts = [];
  const rawParts = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const target = path.join(current, entry.name);
      const relative = path.relative(root, target);
      const [first] = relative.split(path.sep);
      if (!topLevel.has(first) || first === "evals" || CANDIDATE_EXCLUDED_TOP_LEVEL.has(first) || isEvaluatorOwnedPath(relative)) {
        continue;
      }
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        textParts.push(relative);
        rawParts.push(Buffer.from(relative, "utf8"));
        walk(target);
        continue;
      }
      if (!entry.isFile()) continue;
      const buffer = fs.readFileSync(target);
      textParts.push(relative, buffer.toString("utf8"));
      rawParts.push(buffer);
    }
  }

  walk(root);
  return { textParts, rawParts };
}

function skillDirectoryParts(root, directory) {
  if (!fs.existsSync(directory)) return [];
  const parts = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const target = path.join(current, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        parts.push(path.relative(root, target));
        walk(target);
      }
      else if (entry.isFile()) {
        const buffer = fs.readFileSync(target);
        parts.push(path.relative(root, target), buffer.toString("utf8"));
      }
    }
  }
  walk(directory);
  return parts;
}

function candidateSkillParts(root, skill) {
  return skillDirectoryParts(root, path.join(root, "skills", skill));
}

function validateRuntimeSkillArmLeakage(directory, selectedCases, oraclesByCase, label = "runtime skill arm") {
  const errors = [];
  const corpus = normalized(skillDirectoryParts(directory, directory).join("\n"));
  for (const { data, item } of selectedCases) {
    const key = `${data.skill}/${item.id}`;
    const oracle = oraclesByCase.get(key);
    if (!oracle) continue;
    for (const guard of oracle.data.leakageGuards || []) {
      if (corpus.includes(normalized(guard))) {
        errors.push(`${label} leaks ${key} oracle guard ${JSON.stringify(guard)}`);
      }
    }
  }
  return errors;
}

function candidateCorpus(root, item, skill) {
  const parts = [item.prompt];
  const rawParts = [Buffer.from(item.prompt, "utf8")];
  for (const fixture of item.fixtures || []) {
    const full = resolveFixtureFile(path.resolve(root, "evals", "fixtures"), fixture);
    const buffer = fs.readFileSync(full);
    parts.push(fixture);
    parts.push(buffer.toString("utf8"));
    rawParts.push(buffer);
  }
  const repository = candidateVisibleRepositoryParts(root);
  parts.push(...repository.textParts);
  rawParts.push(...repository.rawParts);
  const skillParts = candidateSkillParts(root, skill);
  parts.push(...skillParts);
  rawParts.push(...skillParts.map((part) => Buffer.from(part, "utf8")));
  return { normalizedText: normalized(parts.join("\n")), rawParts };
}

function candidateCorpusIncludes(corpus, guard) {
  const guardBytes = Buffer.from(guard, "utf8");
  return corpus.normalizedText.includes(normalized(guard))
    || corpus.rawParts.some((part) => part.includes(guardBytes));
}

function materializedWorkspaceCorpus(workspace, prompt) {
  const textParts = [prompt];
  const rawParts = [Buffer.from(prompt, "utf8")];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const target = path.join(current, entry.name);
      const relative = path.relative(workspace, target);
      if (entry.isSymbolicLink()) throw new Error(`${relative}: materialized task workspaces do not allow symbolic links`);
      if (entry.isDirectory()) {
        textParts.push(relative);
        rawParts.push(Buffer.from(relative, "utf8"));
        walk(target);
        continue;
      }
      if (!entry.isFile()) continue;
      const buffer = fs.readFileSync(target);
      textParts.push(relative, buffer.toString("utf8"));
      rawParts.push(Buffer.from(relative, "utf8"), buffer);
    }
  }

  walk(workspace);
  return { normalizedText: normalized(textParts.join("\n")), rawParts };
}

function validateMaterializedWorkspaceLeakage(workspace, prompt, oraclesByCase, label = "materialized task workspace") {
  const errors = [];
  const corpus = materializedWorkspaceCorpus(workspace, prompt);
  for (const [key, oracle] of oraclesByCase || []) {
    for (const guard of oracle.data.leakageGuards || []) {
      if (candidateCorpusIncludes(corpus, guard)) {
        errors.push(`${label} leaks ${key} oracle guard ${JSON.stringify(guard)}`);
      }
    }
  }
  return errors;
}

function safeOraclePath(root, relative) {
  if (!isNonEmptyString(relative) || path.isAbsolute(relative)) {
    throw new Error("oracle must be a relative JSON path under evals/oracles");
  }
  const oracleRoot = path.resolve(root, "evals", "oracles");
  const target = path.resolve(oracleRoot, relative);
  const rel = path.relative(oracleRoot, target);
  if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error(`${relative} must stay inside evals/oracles`);
  }
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`${relative} must be a regular non-symbolic-link file`);
  }
  if (stat.size > DEFAULT_MAX_FIXTURE_BYTES) {
    throw new Error(`${relative} exceeds the ${DEFAULT_MAX_FIXTURE_BYTES}-byte oracle limit`);
  }
  const rootReal = fs.realpathSync(oracleRoot);
  const targetReal = fs.realpathSync(target);
  const realRelative = path.relative(rootReal, targetReal);
  if (realRelative === ".." || realRelative.startsWith(`..${path.sep}`) || path.isAbsolute(realRelative)) {
    throw new Error(`${relative} resolves outside evals/oracles`);
  }
  return targetReal;
}

function validateBenchmarkManifest(manifest, datasets, options = {}) {
  const errors = [];
  const root = options.root;
  if (!isObject(manifest)) return ["benchmark manifest must be an object"];
  if (manifest.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!isNonEmptyString(manifest.id)) errors.push("id must be a non-empty string");
  if (!isNonEmptyString(manifest.version)) errors.push("version must be a non-empty string");
  if (!["draft", "frozen"].includes(manifest.status)) errors.push("status must be draft or frozen");
  if (!isNonEmptyString(manifest.scope)) errors.push("scope must be a non-empty string");
  if (!isObject(manifest.primaryBaseline)
    || manifest.primaryBaseline.kind !== "same-goal-terse"
    || manifest.primaryBaseline.id !== "terse-v1") {
    errors.push("primaryBaseline must name the frozen same-goal-terse identity terse-v1");
  }
  if (!Array.isArray(manifest.entries)) {
    errors.push("entries must be an array");
    return errors;
  }

  const knownCases = caseIndex(datasets);
  const seen = new Set();
  manifest.entries.forEach((entry, index) => {
    const prefix = `entries[${index}]`;
    if (!isObject(entry)) {
      errors.push(`${prefix} must be an object`);
      return;
    }
    const id = `${entry.skill}/${entry.case}`;
    if (!isNonEmptyString(entry.skill)) errors.push(`${prefix}.skill must be a non-empty string`);
    if (!isNonEmptyString(entry.case)) errors.push(`${prefix}.case must be a non-empty string`);
    if (seen.has(id)) errors.push(`${prefix} duplicates ${id}`);
    seen.add(id);
    if (!knownCases.has(id)) errors.push(`${prefix} references unknown case ${id}`);
    if (!DISPOSITIONS.has(entry.disposition)) errors.push(`${prefix}.disposition must be keep, adapt, replace, or retire`);
    if (!ROLES.has(entry.role)) errors.push(`${prefix}.role must be positive, bypass, negative, boundary, or control`);
    if (!READINESS.has(entry.readiness)) errors.push(`${prefix}.readiness must be planned, ready, or quarantined`);
    if (!isNonEmptyString(entry.rationale)) errors.push(`${prefix}.rationale must be a non-empty string`);
    if (["replace", "retire"].includes(entry.disposition) && entry.readiness === "ready") {
      errors.push(`${prefix}: replaced or retired cases cannot be ready benchmark cases`);
    }

    if (entry.readiness === "ready") {
      validateSource(errors, entry.source, prefix);
      if (!isNonEmptyString(entry.oracle)) {
        errors.push(`${prefix}.oracle must be present for a ready case`);
      }
      if (root && knownCases.has(id)) {
        const knownItem = knownCases.get(id).item;
        for (const fixture of knownItem.fixtures || []) {
          if (VERDICT_BEARING_FIXTURE_NAME.test(path.basename(fixture))) {
            errors.push(`${prefix}: candidate-visible fixture name ${JSON.stringify(fixture)} reveals an expected verdict`);
          }
        }
      }
    }

    if (isNonEmptyString(entry.oracle) && root && knownCases.has(id)) {
      const knownItem = knownCases.get(id).item;
      try {
        const oracleFile = safeOraclePath(root, entry.oracle);
        const source = fs.readFileSync(oracleFile, "utf8");
        const oracle = JSON.parse(source);
        for (const error of validateOracle(oracle, id)) errors.push(`${prefix}: ${error}`);
        const corpus = candidateCorpus(root, knownItem, entry.skill);
        for (const guard of oracle.leakageGuards || []) {
          if (candidateCorpusIncludes(corpus, guard)) {
            errors.push(`${prefix}: candidate-visible prompt or fixture leaks oracle guard ${JSON.stringify(guard)}`);
          }
        }
      } catch (error) {
        errors.push(`${prefix}: oracle could not be loaded (${error.message})`);
      }
    }
  });

  if (manifest.status === "frozen") {
    for (const id of knownCases.keys()) {
      if (!seen.has(id)) errors.push(`frozen manifest is missing case ${id}`);
    }
    for (const entry of manifest.entries) {
      if (entry.readiness === "planned") errors.push(`frozen manifest cannot contain planned case ${entry.skill}/${entry.case}`);
    }
    const skills = new Set([...knownCases.values()].map(({ data }) => data.skill));
    for (const skill of skills) {
      const active = manifest.entries.filter((entry) => (
        entry.skill === skill
        && entry.readiness === "ready"
        && !["replace", "retire"].includes(entry.disposition)
      ));
      if (!active.some((entry) => entry.role === "positive")) errors.push(`frozen manifest skill ${skill} needs a positive case`);
      if (!active.some((entry) => ["bypass", "negative"].includes(entry.role))) errors.push(`frozen manifest skill ${skill} needs a bypass or negative case`);
    }
  }
  return errors;
}

function loadBenchmarkWorkspace(root, datasets) {
  const manifestFile = path.join(root, "evals", "benchmark", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  const errors = validateBenchmarkManifest(manifest, datasets, { root });
  if (errors.length > 0) throw new Error(errors.join("\n"));
  const oraclesByCase = new Map();
  const leakageOraclesByCase = new Map();
  for (const entry of manifest.entries) {
    if (!entry.oracle) continue;
    const id = `${entry.skill}/${entry.case}`;
    const file = safeOraclePath(root, entry.oracle);
    const source = fs.readFileSync(file, "utf8");
    const data = JSON.parse(source);
    const oracleErrors = validateOracle(data, id);
    if (oracleErrors.length > 0) throw new Error(oracleErrors.map((error) => `${id}: ${error}`).join("\n"));
    const record = {
      path: path.relative(root, file),
      sha256: sha256(source),
      data
    };
    leakageOraclesByCase.set(id, record);
    if (entry.readiness === "ready") oraclesByCase.set(id, record);
  }
  return { manifest, oraclesByCase, leakageOraclesByCase };
}

module.exports = {
  loadBenchmarkWorkspace,
  validateMaterializedWorkspaceLeakage,
  validateRuntimeSkillArmLeakage,
  validateBenchmarkManifest,
  validateOracle
};
