#!/usr/bin/env node

"use strict";

const path = require("path");
const { readRetainedJsonFile, validateIndependentReviewArtifact } = require("./eval-workspace");

const runDirectory = process.argv[2];
if (!runDirectory) {
  console.error("Usage: npm run eval:verify-review -- <run-directory>");
  process.exit(1);
}

const root = path.resolve(runDirectory);
let manifest;
let review;
try {
  manifest = readRetainedJsonFile(root, "manifest.json", "manifest.json");
  review = readRetainedJsonFile(root, "independent-review.json", "independent-review.json");
} catch (error) {
  console.error(`Unable to read retained review evidence: ${error.message}`);
  process.exit(1);
}

const errors = validateIndependentReviewArtifact(review, manifest, root);
if (errors.length > 0) {
  console.error("Independent review evidence is not claim-ready:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Independent review evidence verified for ${manifest.runId}.`);
