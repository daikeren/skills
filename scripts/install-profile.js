#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const root = process.cwd();

function parseArgs(argv) {
  const args = { profile: "generic", target: null, print: false };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === "--profile") {
      args.profile = argv[++i];
    } else if (item === "--target") {
      args.target = argv[++i];
    } else if (item === "--print") {
      args.print = true;
    } else {
      console.error(`Unknown argument: ${item}`);
      process.exit(1);
    }
  }
  return args;
}

function expandHome(value) {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const profilePath = path.join(root, "profiles", args.profile, "profile.md");
  if (!fs.existsSync(profilePath)) {
    console.error(`Unknown profile: ${args.profile}`);
    process.exit(1);
  }

  const text = fs.readFileSync(profilePath, "utf8").trim();
  const block = `\n\n<!-- BEGIN cto-agent-skills:${args.profile} -->\n${text}\n<!-- END cto-agent-skills:${args.profile} -->\n`;

  if (args.print || !args.target) {
    console.log(block.trim());
    return;
  }

  const target = path.resolve(expandHome(args.target));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const existing = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  const start = `<!-- BEGIN cto-agent-skills:${args.profile} -->`;
  const end = `<!-- END cto-agent-skills:${args.profile} -->`;
  const pattern = new RegExp(`\\n?${start}[\\s\\S]*?${end}\\n?`);
  const next = existing.match(pattern)
    ? existing.replace(pattern, block)
    : `${existing.replace(/\s*$/, "")}${block}`;
  fs.writeFileSync(target, next);
  console.log(`Installed ${args.profile} profile into ${target}`);
}

main();
