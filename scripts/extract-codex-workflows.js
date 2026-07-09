#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const inputFiles = process.argv.slice(2);

function usage() {
  console.error("Usage: node scripts/extract-codex-workflows.js <transcript.md|txt> [...]");
}

function extractSignals(text) {
  const lines = text.split(/\r?\n/);
  const signals = [];
  const patterns = [
    /\bchanged files?\b/i,
    /\bverification\b/i,
    /\btests? (ran|passed|failed)\b/i,
    /\blearned\b/i,
    /\bfollow-?up\b/i,
    /\bpitfall\b/i,
    /\brollback\b/i,
    /\bdecision\b/i,
    /\brisk\b/i
  ];

  lines.forEach((line, index) => {
    if (patterns.some((pattern) => pattern.test(line))) {
      signals.push({ line: index + 1, text: line.trim() });
    }
  });

  return signals;
}

function summarizeFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const signals = extractSignals(text);
  return {
    file,
    signalCount: signals.length,
    signals: signals.slice(0, 50),
    candidateNote: {
      lesson: "",
      appliesWhen: "",
      evidence: signals.slice(0, 5).map((signal) => `${signal.line}: ${signal.text}`),
      practice: "",
      pitfalls: "",
      candidateHome: "references/observed-workflows.md"
    }
  };
}

function main() {
  if (inputFiles.length === 0) {
    usage();
    process.exit(1);
  }

  const summaries = [];
  for (const file of inputFiles) {
    const full = path.resolve(file);
    if (!fs.existsSync(full)) {
      console.error(`Missing input: ${file}`);
      process.exitCode = 1;
      continue;
    }
    summaries.push(summarizeFile(full));
  }

  console.log(JSON.stringify({ summaries }, null, 2));
}

main();
