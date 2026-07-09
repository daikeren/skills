#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const sourceDir = path.join(root, "commands");
const targetDirs = [path.join(root, ".claude", "commands"), path.join(root, ".opencode", "commands")];

function copyCommands(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  const sourceFiles = fs.readdirSync(sourceDir).filter((file) => file.endsWith(".md")).sort();
  const expected = new Set(sourceFiles);

  for (const file of sourceFiles) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
  }

  for (const file of fs.readdirSync(targetDir).filter((entry) => entry.endsWith(".md"))) {
    if (!expected.has(file)) {
      fs.unlinkSync(path.join(targetDir, file));
    }
  }
}

function main() {
  if (!fs.existsSync(sourceDir)) {
    console.error("commands directory is missing");
    process.exit(1);
  }

  for (const targetDir of targetDirs) {
    copyCommands(targetDir);
  }

  console.log("Command wrappers synced.");
}

main();
