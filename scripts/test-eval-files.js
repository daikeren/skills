#!/usr/bin/env node

const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { resolveFixtureFile } = require("./eval-files");

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engineering-judgment-eval-files-"));
try {
  const fixturesRoot = path.join(tempRoot, "fixtures");
  fs.mkdirSync(fixturesRoot);
  const fixture = path.join(fixturesRoot, "safe.md");
  fs.writeFileSync(fixture, "safe fixture\n");
  assert.equal(resolveFixtureFile(fixturesRoot, "safe.md"), fs.realpathSync(fixture));

  assert.throws(
    () => resolveFixtureFile(fixturesRoot, "../outside.md"),
    /must stay inside evals\/fixtures/
  );

  const outside = path.join(tempRoot, "outside.md");
  const link = path.join(fixturesRoot, "outside-link.md");
  fs.writeFileSync(outside, "outside\n");
  try {
    fs.symlinkSync(outside, link);
    assert.throws(() => resolveFixtureFile(fixturesRoot, "outside-link.md"), /must not be a symbolic link/);
  } catch (error) {
    if (!error || !["EPERM", "EACCES"].includes(error.code)) {
      throw error;
    }
  }

  const large = path.join(fixturesRoot, "large.md");
  fs.writeFileSync(large, "12345");
  assert.throws(() => resolveFixtureFile(fixturesRoot, "large.md", 4), /exceeds the 4-byte fixture limit/);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log("Eval fixture safety tests passed.");
