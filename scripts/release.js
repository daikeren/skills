#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const version = process.argv[2];

function usage() {
  console.error("Usage: node scripts/release.js <semver>");
}

function isSemver(value) {
  return /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/.test(value);
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function writeJson(rel, data) {
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(data, null, 2)}\n`);
}

function updateChangelog(nextVersion) {
  const rel = "CHANGELOG.md";
  const file = path.join(root, rel);
  const date = new Date().toISOString().slice(0, 10);
  const entry = `## ${nextVersion} - ${date}\n\n- TODO: summarize release changes.\n\n`;

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `# Changelog\n\n${entry}`);
    return;
  }

  const text = fs.readFileSync(file, "utf8");
  if (text.includes(`## ${nextVersion} -`)) {
    return;
  }

  fs.writeFileSync(file, text.replace(/^# Changelog\n\n/, `# Changelog\n\n${entry}`));
}

function main() {
  if (!version || !isSemver(version)) {
    usage();
    process.exit(1);
  }

  const files = ["package.json", ".codex-plugin/plugin.json", ".claude-plugin/plugin.json"];
  for (const rel of files) {
    const json = readJson(rel);
    json.version = version;
    writeJson(rel, json);
  }
  updateChangelog(version);

  console.log(`Prepared release ${version}. Review CHANGELOG.md before publishing.`);
}

main();
