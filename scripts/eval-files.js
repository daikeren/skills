"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_MAX_FIXTURE_BYTES = 1024 * 1024;

function isOutsideRoot(relative) {
  return relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}

function resolveFixtureFile(fixturesRoot, fixture, maxBytes = DEFAULT_MAX_FIXTURE_BYTES) {
  if (typeof fixture !== "string" || !fixture.trim()) {
    throw new Error("fixture name must be a non-empty string");
  }
  if (path.isAbsolute(fixture)) {
    throw new Error(`${fixture} must stay inside evals/fixtures`);
  }

  const rootReal = fs.realpathSync(fixturesRoot);
  const candidate = path.resolve(fixturesRoot, fixture);
  if (isOutsideRoot(path.relative(fixturesRoot, candidate))) {
    throw new Error(`${fixture} must stay inside evals/fixtures`);
  }

  let stat;
  try {
    stat = fs.lstatSync(candidate);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`${fixture} does not exist`);
    }
    throw error;
  }
  if (stat.isSymbolicLink()) {
    throw new Error(`${fixture} must not be a symbolic link`);
  }

  const real = fs.realpathSync(candidate);
  if (isOutsideRoot(path.relative(rootReal, real))) {
    throw new Error(`${fixture} resolves outside evals/fixtures`);
  }

  stat = fs.statSync(real);
  if (!stat.isFile()) {
    throw new Error(`${fixture} must be a regular file`);
  }
  if (stat.size > maxBytes) {
    throw new Error(`${fixture} exceeds the ${maxBytes}-byte fixture limit`);
  }
  return real;
}

module.exports = {
  DEFAULT_MAX_FIXTURE_BYTES,
  resolveFixtureFile
};
