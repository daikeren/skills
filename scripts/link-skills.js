#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const root = process.cwd();
const skillRoot = path.join(root, "skills");

const agentTargets = {
  universal: path.join(os.homedir(), ".agents", "skills"),
  codex: path.join(os.homedir(), ".codex", "skills"),
  "claude-code": path.join(os.homedir(), ".claude", "skills"),
  opencode: path.join(os.homedir(), ".config", "opencode", "skills"),
  pi: path.join(os.homedir(), ".pi", "agent", "skills")
};

function parseArgs(argv) {
  const args = { agent: "universal", target: null, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === "--dry-run") {
      args.dryRun = true;
    } else if (item === "--agent") {
      args.agent = argv[++i];
    } else if (item === "--target") {
      args.target = argv[++i];
    } else {
      console.error(`Unknown argument: ${item}`);
      process.exit(1);
    }
  }
  return args;
}

function linkSkill(source, target, dryRun) {
  if (fs.existsSync(target)) {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) {
      const current = fs.readlinkSync(target);
      if (path.resolve(path.dirname(target), current) === source) {
        return "already-linked";
      }
      if (!dryRun) fs.unlinkSync(target);
    } else {
      return "exists";
    }
  }

  if (!dryRun) {
    fs.symlinkSync(source, target, "dir");
  }
  return "linked";
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const targetRoot = args.target
    ? path.resolve(args.target)
    : agentTargets[args.agent];

  if (!targetRoot) {
    console.error(`Unknown agent "${args.agent}". Use one of: ${Object.keys(agentTargets).join(", ")}`);
    process.exit(1);
  }

  if (!fs.existsSync(skillRoot)) {
    console.error("skills directory is missing");
    process.exit(1);
  }

  if (!args.dryRun) {
    fs.mkdirSync(targetRoot, { recursive: true });
  }

  const results = [];
  for (const entry of fs.readdirSync(skillRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const source = path.join(skillRoot, entry.name);
    const target = path.join(targetRoot, entry.name);
    results.push({ skill: entry.name, target, status: linkSkill(source, target, args.dryRun) });
  }

  for (const result of results) {
    console.log(`${result.status}: ${result.skill} -> ${result.target}`);
  }

  const blocked = results.filter((result) => result.status === "exists");
  if (blocked.length > 0) {
    console.error("Some targets already exist and are not symlinks. Move them first or use --target for a scratch directory.");
    process.exit(1);
  }
}

main();
