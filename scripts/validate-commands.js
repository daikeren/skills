#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const skillRoot = path.join(root, "skills");
const commandDirs = ["commands", ".claude/commands", ".opencode/commands"];
const errors = [];

function fail(message) {
  errors.push(message);
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function skillNames() {
  if (!fs.existsSync(skillRoot)) {
    fail("skills: missing skills directory");
    return [];
  }

  return fs
    .readdirSync(skillRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function parseCommand(rel, expectedSkill) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    fail(`${rel}: missing command wrapper`);
    return;
  }

  const text = readText(file);
  if (!text.startsWith("---\n")) {
    fail(`${rel}: missing frontmatter`);
  }
  if (!/^description:\s+.+$/m.test(text)) {
    fail(`${rel}: missing description`);
  }
  if (!text.includes(`\`${expectedSkill}\``)) {
    fail(`${rel}: command body must mention \`${expectedSkill}\``);
  }
  if (!text.includes("$ARGUMENTS")) {
    fail(`${rel}: command body must pass $ARGUMENTS`);
  }
}

function main() {
  const skills = skillNames();

  for (const dir of commandDirs) {
    const fullDir = path.join(root, dir);
    if (!fs.existsSync(fullDir)) {
      fail(`${dir}: missing command directory`);
      continue;
    }

    const commandFiles = fs
      .readdirSync(fullDir)
      .filter((file) => file.endsWith(".md"))
      .sort();
    const expectedFiles = skills.map((name) => `${name}.md`);

    for (const expected of expectedFiles) {
      parseCommand(path.join(dir, expected), expected.replace(/\.md$/, ""));
    }

    for (const actual of commandFiles) {
      if (!expectedFiles.includes(actual)) {
        fail(`${dir}/${actual}: command does not match a skill`);
      }
    }
  }

  if (errors.length > 0) {
    console.error("Command validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Command validation passed.");
}

main();
