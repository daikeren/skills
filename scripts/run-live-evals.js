#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();
const casesDir = path.join(root, "evals", "cases");
const fixturesDir = path.join(root, "evals", "fixtures");
const resultsDir = path.join(root, "evals", "results");
const agent = process.env.LIVE_EVAL_AGENT;
const commandOverride = process.env.LIVE_EVAL_COMMAND;

function usage() {
  console.error("Set LIVE_EVAL_AGENT=codex or LIVE_EVAL_AGENT=claude-code.");
  console.error("Optional: set LIVE_EVAL_COMMAND to override the command. The prompt is appended as the last argument.");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function buildPrompt(data, item) {
  const skillPath = path.join(root, "skills", data.skill, "SKILL.md");
  const fixtures = fs.existsSync(fixturesDir)
    ? fs.readdirSync(fixturesDir).map((file) => path.join(fixturesDir, file))
    : [];

  return [
    `Use the Agent Skill at ${skillPath}.`,
    `Task: ${item.prompt}`,
    fixtures.length ? `Available throwaway fixtures:\n${fixtures.join("\n")}` : "",
    "Return the work product and include evidence of the trace expectations where relevant."
  ]
    .filter(Boolean)
    .join("\n\n");
}

function commandFor(prompt) {
  if (commandOverride) {
    return { command: commandOverride, args: [prompt] };
  }
  if (agent === "claude-code") {
    return { command: "claude", args: ["-p", prompt, "--output-format", "json"] };
  }
  if (agent === "codex") {
    return { command: "codex", args: ["exec", prompt] };
  }
  usage();
  process.exit(1);
}

function termsFor(expectation) {
  return expectation
    .toLowerCase()
    .replace(/[^a-z0-9 /-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 5)
    .slice(0, 4);
}

function checkExpectations(output, expectations) {
  const lower = output.toLowerCase();
  return expectations.map((expectation) => {
    const terms = termsFor(expectation);
    const matched = terms.filter((term) => lower.includes(term));
    return {
      expectation,
      matchedTerms: matched,
      status: matched.length > 0 ? "pass" : "review"
    };
  });
}

function runCase(data, item) {
  const prompt = buildPrompt(data, item);
  const cmd = commandFor(prompt);
  const result = spawnSync(cmd.command, cmd.args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 10
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();

  return {
    skill: data.skill,
    id: item.id,
    status: result.status === 0 ? "completed" : "command-failed",
    command: cmd.command,
    checks: checkExpectations(output, data.traceExpectations || []),
    outputPreview: output.slice(0, 4000)
  };
}

function main() {
  if (!agent && !commandOverride) {
    usage();
    process.exit(1);
  }

  const results = [];
  for (const file of fs.readdirSync(casesDir).filter((name) => name.endsWith(".json")).sort()) {
    const data = readJson(path.join(casesDir, file));
    for (const item of data.cases || []) {
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
  const review = results.flatMap((item) =>
    item.checks.filter((check) => check.status !== "pass").map((check) => `${item.skill}/${item.id}: ${check.expectation}`)
  );

  if (failed.length > 0 || review.length > 0) {
    console.error(`Live eval completed with ${failed.length} command failures and ${review.length} expectations needing review.`);
    process.exit(1);
  }

  console.log(`Live eval passed for ${results.length} cases.`);
}

main();
