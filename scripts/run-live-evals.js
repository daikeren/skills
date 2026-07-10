#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { DEFAULT_MAX_FIXTURE_BYTES, resolveFixtureFile } = require("./eval-files");
const { validateEvalCoverage, validateEvalData } = require("./eval-schema");

const root = process.cwd();
const casesDir = path.join(root, "evals", "cases");
const resultsDir = path.join(root, "evals", "results");
const packageFiles = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).files || [];
const WORKSPACE_TOP_LEVEL = new Set([
  "package.json",
  "AGENTS.md",
  ".gitignore",
  ".github",
  ...packageFiles.map((entry) => entry.split("/")[0]).filter(Boolean)
]);
const agent = process.env.LIVE_EVAL_AGENT;
const commandOverride = process.env.LIVE_EVAL_COMMAND;
const judgeCommandOverride = process.env.LIVE_EVAL_JUDGE_COMMAND;
const DEFAULT_COMMAND_TIMEOUT_MS = 5 * 60 * 1000;
let commandTimeoutMs = DEFAULT_COMMAND_TIMEOUT_MS;
let maxFixtureBytes = DEFAULT_MAX_FIXTURE_BYTES;

function usage() {
  console.error("Set LIVE_EVAL_AGENT=codex or LIVE_EVAL_AGENT=claude-code.");
  console.error("Optional: set LIVE_EVAL_COMMAND to override the command. The prompt is appended as the last argument.");
  console.error("Optional: set LIVE_EVAL_JUDGE_COMMAND to use a separate JSON judge command. The judge prompt is appended as the last argument.");
  console.error("Optional: set LIVE_EVAL_TIMEOUT_MS or LIVE_EVAL_MAX_FIXTURE_BYTES to positive integers.");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function installedSkillNames() {
  const skillRoot = path.join(root, "skills");
  if (!fs.existsSync(skillRoot)) return [];
  return fs
    .readdirSync(skillRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(skillRoot, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
}

function positiveIntegerEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function configureLimits() {
  commandTimeoutMs = positiveIntegerEnv("LIVE_EVAL_TIMEOUT_MS", DEFAULT_COMMAND_TIMEOUT_MS);
  maxFixtureBytes = positiveIntegerEnv("LIVE_EVAL_MAX_FIXTURE_BYTES", DEFAULT_MAX_FIXTURE_BYTES);
}

function copyFilter(source) {
  const rel = path.relative(root, source);
  if (!rel) return true;
  const parts = rel.split(path.sep);
  if (!WORKSPACE_TOP_LEVEL.has(parts[0])) {
    return false;
  }
  if (parts[0] === "evals" && parts[1] === "results") {
    return false;
  }
  if (fs.lstatSync(source).isSymbolicLink()) {
    throw new Error(`${rel}: live eval workspaces do not allow symbolic links`);
  }
  return true;
}

function createCaseWorkspace() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-live-eval-"));
  const workspace = path.join(tempRoot, "repo");
  try {
    fs.cpSync(root, workspace, { recursive: true, filter: copyFilter });
    return { tempRoot, workspace };
  } catch (error) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

function cleanupCaseWorkspace(caseWorkspace) {
  if (caseWorkspace && caseWorkspace.tempRoot) {
    fs.rmSync(caseWorkspace.tempRoot, { recursive: true, force: true });
  }
}

function createJudgeWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-live-eval-judge-"));
}

function cleanupJudgeWorkspace(workspace) {
  if (workspace) {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

function caseFixtures(item, workspace) {
  if (item.fixtures === undefined) {
    return [];
  }
  if (!Array.isArray(item.fixtures)) {
    throw new Error(`${item.id}: fixtures must be an array of fixture file names`);
  }
  const fixturesDir = path.join(workspace, "evals", "fixtures");
  return item.fixtures.map((fixture) => {
    const full = resolveFixtureFile(fixturesDir, fixture, maxFixtureBytes);
    return {
      name: fixture,
      path: full,
      content: readText(full)
    };
  });
}

function renderFixtures(fixtures) {
  return fixtures
    .map((fixture) => `Fixture ${fixture.name}:\n\n${fixture.content.trim()}`)
    .join("\n\n");
}

function expectationsFor(data, item) {
  const expectations = [];
  for (const [index, check] of (item.checks || []).entries()) {
    expectations.push({
      id: `case-${index + 1}`,
      source: "case",
      text: check,
      requiresEvidence: requiresConcreteEvidence(check)
    });
  }
  for (const [index, check] of (data.traceExpectations || []).entries()) {
    expectations.push({
      id: `trace-${index + 1}`,
      source: "trace",
      text: check,
      requiresEvidence: requiresConcreteEvidence(check)
    });
  }
  return expectations;
}

function requiresConcreteEvidence(expectation) {
  return /\b(command|output|evidence|read|reads|backend|authorization|permission|test|location|file|diff|patch|repo|context|fixture|sample-diff)\b/i.test(expectation);
}

function buildPrompt(data, item, fixtures, workspace) {
  const skillPath = path.join(workspace, "skills", data.skill, "SKILL.md");

  return [
    `Use the Agent Skill at ${skillPath}.`,
    `Task: ${item.prompt}`,
    fixtures.length ? `Throwaway fixtures for this case only:\n\n${renderFixtures(fixtures)}` : "",
    "Return the work product. Include concrete evidence for actions that depend on files, commands, fixtures, or output."
  ]
    .filter(Boolean)
    .join("\n\n");
}

function resolveCommandOverride(command) {
  if (path.isAbsolute(command)) return command;
  if (command.includes("/") || command.includes("\\")) {
    return path.resolve(root, command);
  }
  return command;
}

function commandFor(prompt, role = "agent") {
  if (role === "judge" && judgeCommandOverride) {
    return { command: resolveCommandOverride(judgeCommandOverride), args: [prompt], source: "LIVE_EVAL_JUDGE_COMMAND" };
  }
  if (commandOverride) {
    return { command: resolveCommandOverride(commandOverride), args: [prompt], source: "LIVE_EVAL_COMMAND" };
  }
  if (agent === "claude-code") {
    return { command: "claude", args: ["-p", prompt, "--output-format", "json"], source: "LIVE_EVAL_AGENT" };
  }
  if (agent === "codex") {
    return { command: "codex", args: ["exec", prompt], source: "LIVE_EVAL_AGENT" };
  }
  usage();
  process.exit(1);
}

function terminateProcessTree(pid) {
  if (!pid) return false;
  if (process.platform === "win32") {
    const result = spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
    return result.status === 0;
  }
  try {
    process.kill(-pid, "SIGKILL");
    return true;
  } catch (error) {
    return error.code === "ESRCH";
  }
}

function runCommand(cmd, cwd) {
  const result = spawnSync(cmd.command, cmd.args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 10,
    timeout: commandTimeoutMs,
    killSignal: "SIGKILL",
    detached: true
  });
  terminateProcessTree(result.pid);
  const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();

  return {
    status: result.status === null ? 1 : result.status,
    error: result.error ? result.error.message : null,
    output
  };
}

function buildJudgePrompt(data, item, fixtures, output, expectations) {
  return [
    "You are judging a live eval result for an Agent Skill.",
    "Return JSON only. Do not wrap it in Markdown.",
    "For each expectation, use status \"pass\", \"fail\", or \"review\".",
    "Use \"pass\" only when the agent output itself demonstrates the behavior with concrete evidence.",
    "When a check depends on commands, files, fixtures, repo reading, permissions, tests, or output evidence, do not give credit for unsupported narration or promises.",
    "Use \"review\" when the output is ambiguous or evidence is not observable. Use \"fail\" when the output contradicts or clearly misses the expectation.",
    "Schema: {\"summary\":\"string\",\"checks\":[{\"id\":\"case-1\",\"status\":\"pass|fail|review\",\"evidence\":\"direct quote from the agent output\",\"reason\":\"short reason\"}]}",
    `Skill: ${data.skill}`,
    `Case: ${item.id}`,
    `Task: ${item.prompt}`,
    fixtures.length ? `Fixtures:\n\n${renderFixtures(fixtures)}` : "Fixtures: none",
    `Expectations:\n${JSON.stringify(expectations, null, 2)}`,
    `Agent output:\n\n${output || "(empty output)"}`
  ].join("\n\n");
}

function parseFirstJsonObject(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    // Continue with object extraction below.
  }

  for (let start = trimmed.indexOf("{"); start !== -1; start = trimmed.indexOf("{", start + 1)) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < trimmed.length; index += 1) {
      const char = trimmed[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === "\"") {
          inString = false;
        }
        continue;
      }

      if (char === "\"") {
        inString = true;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(start, index + 1));
          } catch (_error) {
            break;
          }
        }
      }
    }
  }

  return null;
}

function parseJudgeJson(output) {
  const parsed = parseFirstJsonObject(output);
  if (!parsed) return null;

  for (const key of ["result", "output", "text", "message"]) {
    if (!Array.isArray(parsed.checks) && typeof parsed[key] === "string") {
      const nested = parseFirstJsonObject(parsed[key]);
      if (nested) return nested;
    }
  }

  return parsed;
}

function normalizeText(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function evidenceList(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function evidenceAppearsInOutput(output, evidence) {
  const normalizedOutput = normalizeText(output);
  return evidence.some((item) => {
    const normalized = normalizeText(item);
    return normalized.length >= 8 && normalizedOutput.includes(normalized);
  });
}

function reviewChecks(expectations, reason) {
  return expectations.map((expectation) => ({
    id: expectation.id,
    source: expectation.source,
    expectation: expectation.text,
    requiresEvidence: expectation.requiresEvidence,
    status: "review",
    evidence: [],
    reason
  }));
}

function normalizeJudgeChecks(parsed, expectations, output) {
  if (!parsed || !Array.isArray(parsed.checks)) {
    return {
      judgeStatus: "invalid-json",
      summary: "",
      checks: reviewChecks(expectations, "Judge did not return the expected JSON checks array.")
    };
  }

  const byId = new Map();
  for (const check of parsed.checks) {
    if (check && typeof check.id === "string") {
      byId.set(check.id, check);
    }
  }

  const checks = expectations.map((expectation) => {
    const raw = byId.get(expectation.id);
    if (!raw) {
      return {
        id: expectation.id,
        source: expectation.source,
        expectation: expectation.text,
        requiresEvidence: expectation.requiresEvidence,
        status: "review",
        evidence: [],
        reason: "Judge omitted this expectation."
      };
    }

    let status = typeof raw.status === "string" ? raw.status.toLowerCase() : "review";
    if (!["pass", "fail", "review"].includes(status)) {
      status = "review";
    }

    const evidence = evidenceList(raw.evidence);
    let reason = typeof raw.reason === "string" ? raw.reason : "";
    if (status === "pass" && !evidenceAppearsInOutput(output, evidence)) {
      status = "review";
      reason = reason
        ? `${reason} Evidence was not a direct quote from the agent output.`
        : "Pass was downgraded because the evidence was not a direct quote from the agent output.";
    }

    return {
      id: expectation.id,
      source: expectation.source,
      expectation: expectation.text,
      requiresEvidence: expectation.requiresEvidence,
      status,
      evidence,
      reason
    };
  });

  return {
    judgeStatus: "completed",
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    checks
  };
}

function judgeOutput(data, item, fixtures, output, expectations) {
  const prompt = buildJudgePrompt(data, item, fixtures, output, expectations);
  const cmd = commandFor(prompt, "judge");
  let workspace;
  let result;
  try {
    workspace = createJudgeWorkspace();
    result = runCommand(cmd, workspace);
  } catch (error) {
    return {
      judge: {
        status: "workspace-failed",
        command: cmd.command,
        source: cmd.source,
        error: error.message,
        outputPreview: ""
      },
      checks: reviewChecks(expectations, "Judge workspace could not be created or used safely.")
    };
  } finally {
    cleanupJudgeWorkspace(workspace);
  }

  if (result.status !== 0) {
    return {
      judge: {
        status: "command-failed",
        command: cmd.command,
        source: cmd.source,
        error: result.error,
        outputPreview: result.output.slice(0, 2000)
      },
      checks: reviewChecks(expectations, "Judge command failed or was unavailable.")
    };
  }

  const parsed = parseJudgeJson(result.output);
  const normalized = normalizeJudgeChecks(parsed, expectations, output);
  return {
    judge: {
      status: normalized.judgeStatus,
      command: cmd.command,
      source: cmd.source,
      summary: normalized.summary,
      outputPreview: result.output.slice(0, 2000)
    },
    checks: normalized.checks
  };
}

function judgmentStatus(checks) {
  if (checks.some((check) => check.status === "fail")) {
    return "fail";
  }
  if (checks.some((check) => check.status !== "pass")) {
    return "review";
  }
  return "pass";
}

function runCase(data, item) {
  let caseWorkspace;
  try {
    caseWorkspace = createCaseWorkspace();
  } catch (error) {
    const expectations = expectationsFor(data, item);
    return {
      skill: data.skill,
      id: item.id,
      status: "workspace-failed",
      judgmentStatus: "review",
      command: null,
      fixtures: [],
      judge: { status: "not-run", reason: error.message },
      checks: reviewChecks(expectations, error.message),
      outputPreview: ""
    };
  }

  try {
    let fixtures;
    try {
      fixtures = caseFixtures(item, caseWorkspace.workspace);
    } catch (error) {
      const expectations = expectationsFor(data, item);
      return {
        skill: data.skill,
        id: item.id,
        status: "invalid-case",
        judgmentStatus: "review",
        command: null,
        fixtures: [],
        judge: { status: "not-run", reason: error.message },
        checks: reviewChecks(expectations, error.message),
        outputPreview: ""
      };
    }

    const expectations = expectationsFor(data, item);
    const prompt = buildPrompt(data, item, fixtures, caseWorkspace.workspace);
    const cmd = commandFor(prompt);
    const result = runCommand(cmd, caseWorkspace.workspace);
    const output = result.output;

    if (result.status !== 0) {
      return {
        skill: data.skill,
        id: item.id,
        status: "command-failed",
        judgmentStatus: "review",
        command: cmd.command,
        commandSource: cmd.source,
        commandError: result.error,
        fixtures: fixtures.map((fixture) => fixture.name),
        judge: { status: "not-run" },
        checks: reviewChecks(expectations, "Agent command failed before judging."),
        outputPreview: output.slice(0, 4000)
      };
    }

    const judged = judgeOutput(data, item, fixtures, output, expectations);

    return {
      skill: data.skill,
      id: item.id,
      status: "completed",
      judgmentStatus: judgmentStatus(judged.checks),
      command: cmd.command,
      commandSource: cmd.source,
      fixtures: fixtures.map((fixture) => fixture.name),
      judge: judged.judge,
      checks: judged.checks,
      outputPreview: output.slice(0, 4000)
    };
  } finally {
    cleanupCaseWorkspace(caseWorkspace);
  }
}

function main() {
  if (!agent && !commandOverride) {
    usage();
    process.exit(1);
  }

  try {
    configureLimits();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const datasets = [];
  const schemaErrors = [];
  if (!fs.existsSync(casesDir)) {
    schemaErrors.push("evals/cases: missing");
  } else {
    for (const file of fs.readdirSync(casesDir).filter((name) => name.endsWith(".json")).sort()) {
      const rel = path.join("evals", "cases", file);
      let data;
      try {
        data = readJson(path.join(casesDir, file));
      } catch (error) {
        schemaErrors.push(`${rel}: invalid JSON (${error.message})`);
        continue;
      }
      const errors = validateEvalData(data);
      for (const error of errors) {
        schemaErrors.push(`${rel}: ${error}`);
      }
      datasets.push({ data, file: rel });
    }
  }
  if (schemaErrors.length === 0) {
    const coverageDatasets = datasets.map((dataset) => ({
      skill: dataset.data.skill,
      file: dataset.file,
      expectedSkills: (dataset.data.negativeRoutes || []).map((route) => route.expectedSkill)
    }));
    for (const error of validateEvalCoverage(installedSkillNames(), coverageDatasets)) {
      schemaErrors.push(`evals/cases: ${error}`);
    }
  }
  if (schemaErrors.length > 0) {
    console.error("Live eval case validation failed:");
    for (const error of schemaErrors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  const results = [];
  for (const { data } of datasets) {
    for (const item of data.cases) {
      results.push(runCase(data, item));
    }
  }

  fs.mkdirSync(resultsDir, { recursive: true });
  const out = {
    generatedAt: new Date().toISOString(),
    agent: agent || "custom",
    results
  };
  fs.writeFileSync(path.join(resultsDir, "live-latest.json"), `${JSON.stringify(out, null, 2)}\n`);

  const failed = results.filter((item) => item.status !== "completed");
  const failedChecks = results.flatMap((item) =>
    item.checks.filter((check) => check.status === "fail").map((check) => `${item.skill}/${item.id}: ${check.expectation}`)
  );
  const review = results.flatMap((item) =>
    item.checks.filter((check) => check.status === "review").map((check) => `${item.skill}/${item.id}: ${check.expectation}`)
  );

  if (failed.length > 0 || failedChecks.length > 0 || review.length > 0) {
    console.error(`Live eval completed with ${failed.length} command failures, ${failedChecks.length} failed expectations, and ${review.length} expectations needing review.`);
    process.exit(1);
  }

  console.log(`Live eval passed for ${results.length} cases.`);
}

if (require.main === module) {
  main();
}

module.exports = {
  cleanupCaseWorkspace,
  cleanupJudgeWorkspace,
  configureLimits,
  createCaseWorkspace,
  createJudgeWorkspace,
  positiveIntegerEnv,
  resolveCommandOverride,
  runCommand,
  terminateProcessTree
};
