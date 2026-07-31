"use strict";

const path = require("path");

const EXACT_EVALUATOR_SCRIPTS = new Set([
  "generate-eval-sample.js",
  "run-evals.js",
  "run-live-evals.js",
  "test-live-eval-safety.js",
  "verify-independent-review.js"
]);

function isEvaluatorOwnedPath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath) return false;
  const normalized = relativePath.split(path.sep).join("/");
  if (!normalized.startsWith("scripts/")) return false;
  const basename = path.posix.basename(normalized);
  return basename.startsWith("eval-")
    || basename.startsWith("test-eval-")
    || EXACT_EVALUATOR_SCRIPTS.has(basename);
}

module.exports = {
  isEvaluatorOwnedPath
};
