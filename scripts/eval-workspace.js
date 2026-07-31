"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { isEvaluatorOwnedPath } = require("./eval-surface-policy");

const ARTIFACT_SCHEMA_VERSION = 1;
const FROZEN_TERSE_INSTRUCTION_VERSION = "terse-v1";
const FROZEN_TERSE_INSTRUCTION = "Complete the task and return the work product.";
const NO_INSTRUCTION_VERSION = "no-instruction-v1";
const QUALITY_DIMENSIONS = [
  "contract-compliance",
  "applicability",
  "outcome-quality",
  "risk-detection",
  "execution-burden"
];
const BASELINE_KINDS = ["terse", "previous-skill", "no-instruction"];
const MAX_RETAINED_OUTPUT_BYTES = 256 * 1024;

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function directoryIdentityDigest(files) {
  return sha256(files.map((file) => `${file.type}\0${file.path}\0${file.mode}\0${file.size ?? ""}\0${file.sha256 ?? ""}`).join("\n"));
}

function isOutsideRoot(relative) {
  return relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}

const TEXT_CREDENTIAL_KEY = "(?:api[-_]?key|authorization|auth[-_]?token|oauth[-_]?token|access[-_]?token|refresh[-_]?token|session[-_]?token|cookie|credentials?|passwd|password|private[-_]?key|client[-_]?secret)";

function redactYamlCredentials(value) {
  const lines = value.split(/\r?\n/);
  const keyLine = new RegExp(`^(\\s*(?:-\\s*)?[\"']?${TEXT_CREDENTIAL_KEY}[\"']?\\s*:\\s*)(.*)$`, "i");
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(keyLine);
    if (!match) continue;
    const indentation = match[1].match(/^\s*/)[0].length;
    const block = /^[|>](?:[-+]?[0-9]?|[0-9]?[-+]?)?(?:\s+#.*)?$/.test(match[2].trim());
    lines[index] = `${match[1]}<redacted>`;
    if (!block) continue;
    for (let nested = index + 1; nested < lines.length; nested += 1) {
      if (!lines[nested].trim()) continue;
      const nestedIndentation = lines[nested].match(/^\s*/)[0].length;
      if (nestedIndentation <= indentation) break;
      lines[nested] = `${lines[nested].slice(0, nestedIndentation)}<redacted>`;
    }
  }
  return lines.join("\n");
}

function redactText(value) {
  if (typeof value !== "string") return value;
  let jsonRedacted = value;
  let parsedJson = false;
  const trimmed = value.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      jsonRedacted = JSON.stringify(redactValue(parsed));
      parsedJson = true;
    } catch (_error) {
      // Fall through to conservative text handling.
    }
  }
  if (
    !parsedJson
    && new RegExp(`(?:^|[,{\\s])[\"']?${TEXT_CREDENTIAL_KEY}[\"']?\\s*:`, "i").test(value)
  ) {
    return "<redacted credential-bearing text>";
  }
  const home = os.homedir();
  const homeRedacted = home && home !== path.parse(home).root
    ? redactYamlCredentials(jsonRedacted).split(home).join("<home>")
    : redactYamlCredentials(jsonRedacted);
  return homeRedacted
    .replace(/\b((?:[A-Za-z_][A-Za-z0-9_]*_)?(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|AUTHORIZATION|COOKIE|CREDENTIALS?))\s*=\s*(?:"[^"]*"|'[^']*'|[^\s]+)/gi, "$1=<redacted>")
    .replace(/(--(?:token|secret|password|passwd|api-key|authorization|credential|cookie)(?:=|\s+))(?:"[^"]*"|'[^']*'|[^\s]+)/gi, "$1<redacted>")
    .replace(/((?:Authorization|Proxy-Authorization|Cookie|Set-Cookie|X-API-Key|X-Auth-Token):\s*)(?:"[^"]*"|'[^']*'|[^\r\n'\"]+)/gi, "$1<redacted>")
    .replace(/\b(Bearer\s+)([A-Za-z0-9._~+/=-]{8,})/gi, "$1<redacted>")
    .replace(/([?&](?:token|secret|password|api[_-]?key|authorization)=)([^&#\s]+)/gi, "$1<redacted>")
    .replace(/([A-Za-z][A-Za-z0-9+.-]{0,31}:\/\/)[^\s/@]+:[^\s/@]+@/g, "$1<redacted>@")
    .replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[A-Z0-9]{12,})\b/g, "<redacted>")
    .replace(/\/(?:private\/var\/folders|var\/folders)\/[^\s]+\/engineering-judgment-live-eval-[^\s/]+(?:\/repo|\/artifacts)?/g, "<workspace>")
    .replace(/\/tmp\/engineering-judgment-live-eval-[^\s/]+(?:\/repo|\/artifacts)?/g, "<workspace>");
}

function redactValue(value) {
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => {
      const normalizedKey = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      const sensitiveKey = /(?:^|[-_])(?:api[-_]?key|authorization|cookie|credentials?|passwd|password|private[-_]?key|secret)(?:$|[-_])/.test(normalizedKey)
        || /(?:^|[-_])(?:access|auth|bearer|oauth|refresh|session)[-_]token(?:$|[-_])/.test(normalizedKey)
        || (["key", "token"].includes(normalizedKey) && typeof item === "string");
      return [key, sensitiveKey ? "<redacted>" : redactValue(item)];
    }));
  }
  return value;
}

function boundedText(value, limit = MAX_RETAINED_OUTPUT_BYTES) {
  const redacted = redactText(typeof value === "string" ? value : "");
  const buffer = Buffer.from(redacted);
  if (buffer.length <= limit) {
    return { text: redacted, bytes: buffer.length, truncated: false, sha256: sha256(redacted) };
  }
  const text = buffer.subarray(0, limit).toString("utf8");
  return { text, bytes: Buffer.byteLength(text), truncated: true, sha256: sha256(text) };
}

function directoryIdentity(directory) {
  const root = fs.realpathSync(directory);
  const files = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const candidate = path.join(current, entry.name);
      const stat = fs.lstatSync(candidate);
      const relative = path.relative(root, candidate);
      if (stat.isSymbolicLink()) throw new Error(`${relative}: evaluation arm directories do not allow symbolic links`);
      if (stat.isDirectory()) {
        files.push({ type: "directory", path: relative, mode: stat.mode & 0o777 });
        walk(candidate);
      } else if (stat.isFile()) {
        const content = fs.readFileSync(candidate);
        files.push({ type: "file", path: relative, mode: stat.mode & 0o777, size: stat.size, sha256: sha256(content) });
      } else {
        throw new Error(`${relative}: evaluation arm directories allow regular files only`);
      }
    }
  }

  walk(root);
  if (files.length === 0) throw new Error(`${directory}: evaluation arm directory is empty`);
  return {
    algorithm: "sha256",
    digest: directoryIdentityDigest(files),
    files
  };
}

function normalizeBaselineKind(value = "terse") {
  const kind = value || "terse";
  if (!BASELINE_KINDS.includes(kind)) {
    throw new Error(`LIVE_EVAL_BASELINE must be one of: ${BASELINE_KINDS.join(", ")}`);
  }
  return kind;
}

function armId(value, label) {
  if (typeof value !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`${label} must be kebab-case`);
  }
  return value;
}

function promptArmIdentity(kind, options = {}) {
  if (kind === "terse") {
    return {
      id: FROZEN_TERSE_INSTRUCTION_VERSION,
      kind,
      instructionVersion: FROZEN_TERSE_INSTRUCTION_VERSION,
      instructionSha256: sha256(FROZEN_TERSE_INSTRUCTION)
    };
  }
  if (kind === "no-instruction") {
    return {
      id: NO_INSTRUCTION_VERSION,
      kind,
      instructionVersion: NO_INSTRUCTION_VERSION,
      instructionSha256: sha256("")
    };
  }
  if (!options.previousSkillDir) {
    throw new Error("LIVE_EVAL_PREVIOUS_SKILL_DIR is required for the previous-skill baseline");
  }
  const identity = directoryIdentity(options.previousSkillDir);
  const id = options.previousSkillId
    ? armId(options.previousSkillId, "LIVE_EVAL_PREVIOUS_SKILL_ID")
    : `previous-skill-${identity.digest.slice(0, 12)}`;
  if (id === "candidate") {
    throw new Error("LIVE_EVAL_PREVIOUS_SKILL_ID cannot use the reserved candidate evidence path");
  }
  return {
    id,
    kind,
    snapshot: identity
  };
}

function candidateArmIdentity(skillDir, options = {}) {
  const identity = directoryIdentity(skillDir);
  const ablationId = options.ablationId
    ? armId(options.ablationId, "LIVE_EVAL_ABLATION_ID")
    : null;
  if (ablationId && !options.hypothesis) {
    throw new Error("LIVE_EVAL_HYPOTHESIS is required when LIVE_EVAL_ABLATION_ID is set");
  }
  return {
    id: ablationId || `candidate-${identity.digest.slice(0, 12)}`,
    kind: ablationId ? "bounded-ablation" : "current-skill",
    skill: identity,
    hypothesis: options.hypothesis || "unknown",
    ablation: ablationId
      ? { id: ablationId, change: options.ablationChange || "unknown", maximumAlternateCandidates: 1 }
      : null
  };
}

function tokenCount(tokens) {
  if (!tokens || typeof tokens !== "object") return null;
  for (const key of ["total_tokens", "totalTokens"]) {
    if (Number.isFinite(tokens[key])) return tokens[key];
  }
  const input = tokens.input_tokens ?? tokens.inputTokens;
  const output = tokens.output_tokens ?? tokens.outputTokens;
  if (Number.isFinite(input) && Number.isFinite(output)) return input + output;
  return null;
}

function measurementsForArtifact(measurements) {
  if (!measurements || typeof measurements !== "object") return "unknown";
  return redactValue({
    ...measurements,
    durationMs: measurements.durationMs === null || measurements.durationMs === undefined
      ? "unknown"
      : measurements.durationMs,
    toolCalls: measurements.toolCalls === null || measurements.toolCalls === undefined ? "unknown" : measurements.toolCalls,
    toolCallBreakdown: measurements.toolCallBreakdown === null || measurements.toolCallBreakdown === undefined
      ? "unknown"
      : measurements.toolCallBreakdown,
    tokens: measurements.tokens === null || measurements.tokens === undefined ? "unknown" : measurements.tokens,
    tokenCount: tokenCount(measurements.tokens) ?? "unknown"
  });
}

function countValues(values, allowed) {
  const counts = Object.fromEntries(allowed.map((value) => [value, 0]));
  for (const value of values) counts[allowed.includes(value) ? value : "review"] += 1;
  return counts;
}

function ratesFor(counts, total) {
  return Object.fromEntries(
    Object.entries(counts).map(([key, count]) => [key, total === 0 ? 0 : Number((count / total).toFixed(3))])
  );
}

function dimensionWinners(group, id) {
  return group.map((result) => {
    const dimension = result.comparison
      && Array.isArray(result.comparison.dimensions)
      && result.comparison.dimensions.find((item) => item.id === id);
    return dimension ? dimension.winner : "review";
  });
}

function qualityDimensionSummary(group) {
  const winnerAllowed = ["candidate", "baseline", "tie", "review"];
  const summarize = (id) => {
    const counts = countValues(dimensionWinners(group, id), winnerAllowed);
    return { counts, rates: ratesFor(counts, group.length) };
  };
  const contractCounts = countValues(group.map((result) => result.judgmentStatus), ["pass", "fail", "review"]);
  return {
    "contract-compliance": { counts: contractCounts, rates: ratesFor(contractCounts, group.length) },
    applicability: summarize("applicability"),
    "outcome-quality": summarize("task-success"),
    "risk-detection": summarize("missed-risks"),
    "execution-burden": {
      "unnecessary-steps": summarize("unnecessary-steps"),
      "tool-calls": summarize("tool-calls"),
      "elapsed-time": summarize("elapsed-time"),
      "output-burden": summarize("output-burden")
    }
  };
}

function median(values) {
  const numbers = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (numbers.length === 0) return null;
  const middle = Math.floor(numbers.length / 2);
  return numbers.length % 2 ? numbers[middle] : (numbers[middle - 1] + numbers[middle]) / 2;
}

function metricStatistics(values) {
  const numbers = values.filter(Number.isFinite);
  const count = numbers.length;
  const raw = { count, values: numbers };
  if (count === 0) {
    return { ...raw, median: "unknown", mean: "unknown", stddev: "unknown", varianceStatus: "unavailable" };
  }
  const mean = numbers.reduce((sum, value) => sum + value, 0) / count;
  const stddev = count >= 3
    ? Math.sqrt(numbers.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / count)
    : null;
  return {
    ...raw,
    median: median(numbers),
    mean: Number(mean.toFixed(3)),
    stddev: stddev === null ? null : Number(stddev.toFixed(3)),
    varianceStatus: count >= 3 ? "reported" : "insufficient-sample"
  };
}

function assertionAnomalies(group) {
  const byId = new Map();
  for (const result of group) {
    const candidateChecks = Array.isArray(result.checks) ? result.checks : [];
    const baselineChecks = result.comparison && result.comparison.baseline && Array.isArray(result.comparison.baseline.checks)
      ? result.comparison.baseline.checks
      : [];
    for (const check of candidateChecks) {
      const item = byId.get(check.id) || { id: check.id, expectation: check.expectation, candidate: [], baseline: [] };
      item.candidate.push(check.status);
      byId.set(check.id, item);
    }
    for (const check of baselineChecks) {
      const item = byId.get(check.id) || { id: check.id, expectation: check.expectation, candidate: [], baseline: [] };
      item.baseline.push(check.status);
      byId.set(check.id, item);
    }
  }

  const anomalies = [];
  const comparisonEnabled = group.some((result) => result.comparison && result.comparison.enabled);
  for (const item of byId.values()) {
    const candidateComplete = item.candidate.length === group.length;
    const baselineComplete = item.baseline.length === group.length;
    const bothComplete = comparisonEnabled && candidateComplete && baselineComplete;
    const evidenceComplete = candidateComplete && (!comparisonEnabled || baselineComplete);
    if (bothComplete && [...item.candidate, ...item.baseline].every((status) => status === "pass")) {
      anomalies.push({ type: "always-pass-both-arms", ...item });
    }
    if (bothComplete && [...item.candidate, ...item.baseline].every((status) => status === "fail")) {
      anomalies.push({ type: "always-fail-both-arms", ...item });
    }
    if (new Set(item.candidate).size > 1 || new Set(item.baseline).size > 1) {
      anomalies.push({ type: "varies-across-repeats", ...item });
    }
    if (!evidenceComplete || [...item.candidate, ...item.baseline].some((status) => status === "review")) {
      anomalies.push({ type: "unverifiable-from-retained-evidence", ...item });
    }
  }
  return anomalies;
}

function outlierAnomalies(group) {
  if (group.length < 3) return [];
  const anomalies = [];
  const metricDefs = [
    { id: "durationMs", minimumDelta: 1000, read: (measurements) => measurements && measurements.durationMs },
    { id: "tokenCount", minimumDelta: 100, read: (measurements) => measurements && tokenCount(measurements.tokens) }
  ];
  for (const arm of ["candidate", "baseline"]) {
    for (const metric of metricDefs) {
      const values = group.map((result) => {
        const measurements = arm === "candidate"
          ? result.measurements
          : result.comparison && result.comparison.baseline && result.comparison.baseline.measurements;
        return metric.read(measurements);
      });
      const center = median(values);
      if (!Number.isFinite(center)) continue;
      values.forEach((value, index) => {
        if (Number.isFinite(value) && value >= center * 2 && value - center >= metric.minimumDelta) {
          anomalies.push({
            type: `${metric.id}-outlier`,
            arm,
            trial: group[index].trial,
            value,
            median: center
          });
        }
      });
    }
  }
  return anomalies;
}

function surfaceAnomalies(results) {
  const groups = new Map();
  for (const result of results) {
    const key = `${result.skill}/${result.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(result);
  }
  return [...groups.entries()].map(([caseId, group]) => ({
    caseId,
    trials: group.length,
    assertions: assertionAnomalies(group),
    outliers: outlierAnomalies(group)
  }));
}

function safeSegment(value, label) {
  if (typeof value !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`${label} must be kebab-case`);
  }
  return value;
}

function artifactCopy(artifact) {
  const copied = {
    path: redactText(artifact.path),
    size: artifact.size,
    sourceSha256: artifact.sha256
  };
  if (artifact.content === null || artifact.content === undefined) {
    return { ...copied, safeCopy: "omitted-binary" };
  }
  const content = boundedText(artifact.content);
  return { ...copied, safeCopy: content };
}

function evidenceDocument(result, arm, armIdentity) {
  const retained = result.retainedEvidence && result.retainedEvidence[arm];
  const baseline = result.comparison && result.comparison.baseline;
  const checks = arm === "candidate" ? result.checks : baseline && baseline.checks;
  const measurements = arm === "candidate" ? result.measurements : baseline && baseline.measurements;
  const executionTrace = retained && retained.executionTrace;
  return redactValue({
    schemaVersion: ARTIFACT_SCHEMA_VERSION,
    arm: armIdentity,
    status: arm === "candidate" ? result.status : baseline && baseline.status,
    taskWorkspaceIdentity: arm === "candidate"
      ? result.taskWorkspaceIdentity || "unknown"
      : baseline && baseline.taskWorkspaceIdentity || "unknown",
    execution: arm === "candidate"
      ? {
          command: result.command || "unknown",
          args: result.commandArgs || [],
          source: result.commandSource || "unknown",
          identity: result.executionIdentity || "unknown",
          stableThroughExit: result.executionIdentityStable ?? "unknown",
          filesystemReadIsolation: result.filesystemReadIsolation || "unknown"
        }
      : {
          command: baseline && baseline.command || "unknown",
          args: baseline && baseline.commandArgs || [],
          source: baseline && baseline.commandSource || "unknown",
          identity: baseline && baseline.executionIdentity || "unknown",
          stableThroughExit: (baseline && baseline.executionIdentityStable) ?? "unknown",
          filesystemReadIsolation: baseline && baseline.filesystemReadIsolation || "unknown"
        },
    error: arm === "candidate" ? result.commandError || null : baseline && baseline.commandError || null,
    output: boundedText(retained && retained.output),
    artifacts: (retained && retained.artifacts || []).map(artifactCopy),
    measurements: measurementsForArtifact(measurements),
    assertionGrades: Array.isArray(checks) ? checks : "unknown",
    executionTrace: Array.isArray(executionTrace) && executionTrace.length > 0 ? executionTrace : "unknown"
  });
}

function candidateWasAttempted(result) {
  return Boolean(
    typeof result.command === "string" && result.command.length > 0
    || result.retainedEvidence && result.retainedEvidence.candidate
  );
}

function baselineWasAttempted(result) {
  return Boolean(
    (
      result.comparison
      && result.comparison.baseline
      && typeof result.comparison.baseline.command === "string"
      && result.comparison.baseline.command.length > 0
    )
    || (result.retainedEvidence && result.retainedEvidence.baseline)
  );
}

function trialJudgmentDocument(result, evidence, comparisonEnabled) {
  const comparison = result.comparison;
  return redactValue({
    schemaVersion: ARTIFACT_SCHEMA_VERSION,
    caseId: `${result.skill}/${result.id}`,
    trial: result.trial,
    contract: {
      status: result.status,
      judgmentStatus: result.judgmentStatus,
      judge: result.judge || "unknown",
      evidence: evidence.candidate || null
    },
    comparison: comparisonEnabled
      ? {
          enabled: true,
          status: comparison && comparison.status || "not-run",
          skillValue: comparison && comparison.skillValue || "review",
          summary: comparison && comparison.summary || "No completed comparison judgment was available.",
          dimensions: comparison && Array.isArray(comparison.dimensions) ? comparison.dimensions : "unknown",
          generationOrder: comparison && comparison.generationOrder || "unknown",
          presentationOrder: comparison && comparison.presentationOrder || "unknown",
          judge: comparison && comparison.judge || "unknown",
          baseline: {
            status: comparison && comparison.baseline && comparison.baseline.status || "not-executed",
            judgmentStatus: comparison && comparison.baseline && comparison.baseline.judgmentStatus || "review",
            judge: comparison && comparison.baseline && comparison.baseline.judge || "unknown",
            error: comparison && comparison.baseline && comparison.baseline.commandError || null,
            evidence: evidence.baseline || null
          }
        }
      : { enabled: false }
  });
}

function validateRunArtifact(run) {
  const errors = [];
  if (!run || typeof run !== "object") return ["run must be an object"];
  if (run.schemaVersion !== ARTIFACT_SCHEMA_VERSION) errors.push(`schemaVersion must be ${ARTIFACT_SCHEMA_VERSION}`);
  if (typeof run.runId !== "string" || !/^[a-z0-9-]+$/.test(run.runId)) errors.push("runId must use lowercase letters, numbers, and hyphens");
  if (typeof run.generatedAt !== "string" || !run.generatedAt) errors.push("generatedAt must be a non-empty string");
  if (typeof run.qualityTarget !== "string" || !run.qualityTarget) errors.push("qualityTarget must be a non-empty string");
  if (!run.identities || typeof run.identities !== "object") {
    errors.push("identities must be an object");
  } else {
    if (!run.identities.harness || typeof run.identities.harness !== "object") errors.push("identities.harness must be an object");
    if (!run.identities.model || typeof run.identities.model !== "object") errors.push("identities.model must be an object");
    if (!run.identities.candidate && !run.identities.candidateBySkill) errors.push("identities must include candidate or candidateBySkill");
    if (run.comparisonEnabled && !run.identities.baseline) errors.push("comparison runs must include identities.baseline");
    if (run.comparisonEnabled && run.identities.baseline && run.identities.baseline.id === "candidate") {
      errors.push("comparison baseline id cannot use the reserved candidate evidence path");
    }
  }
  if (!Array.isArray(run.selectedCases) || run.selectedCases.length === 0) {
    errors.push("selectedCases must be a non-empty array");
  } else {
    run.selectedCases.forEach((item, index) => {
      if (!item || typeof item.id !== "string" || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(item.id)) {
        errors.push(`selectedCases[${index}].id must be a skill/case ID`);
      }
    });
  }
  if (!Number.isInteger(run.repeats) || run.repeats < 1) errors.push("repeats must be a positive integer");
  if (!Number.isInteger(run.trialCount) || run.trialCount < 1) errors.push("trialCount must be a positive integer");
  if (!Array.isArray(run.results)) {
    errors.push("results must be an array");
  } else {
    if (Number.isInteger(run.trialCount) && run.results.length !== run.trialCount) {
      errors.push("results length must equal trialCount");
    }
    run.results.forEach((result, index) => {
      if (!result || typeof result !== "object") {
        errors.push(`results[${index}] must be an object`);
        return;
      }
      if (typeof result.skill !== "string" || !/^[a-z0-9-]+$/.test(result.skill)) errors.push(`results[${index}].skill must be kebab-case`);
      if (typeof result.id !== "string" || !/^[a-z0-9-]+$/.test(result.id)) errors.push(`results[${index}].id must be kebab-case`);
      if (!Number.isInteger(result.trial) || result.trial < 1) errors.push(`results[${index}].trial must be a positive integer`);
    });
  }
  if (!Array.isArray(run.aggregates)) errors.push("aggregates must be an array");
  if (!Array.isArray(run.anomalies)) errors.push("anomalies must be an array");
  for (const dimension of QUALITY_DIMENSIONS) {
    if (!run.reportedDimensions || !run.reportedDimensions.includes(dimension)) {
      errors.push(`reportedDimensions must include ${dimension}`);
    }
  }
  return errors;
}

function taskWorkspaceSurfaceAllowed(relativePath) {
  if (isEvaluatorOwnedPath(relativePath)) return false;
  const normalized = relativePath.split(path.sep).join("/");
  if (normalized === "evals" || normalized === "evals/fixtures") return true;
  return !normalized.startsWith("evals/") || normalized.startsWith("evals/fixtures/");
}

function validateRetainedTaskWorkspaceIdentity(identity, label) {
  const errors = [];
  if (!identity || typeof identity !== "object" || Array.isArray(identity)) {
    return [`${label} must be a retained task-workspace identity`];
  }
  if (identity.algorithm !== "sha256") errors.push(`${label}.algorithm must be sha256`);
  if (typeof identity.digest !== "string" || !/^[a-f0-9]{64}$/.test(identity.digest)) {
    errors.push(`${label}.digest must be a sha256 digest`);
  }
  if (!Array.isArray(identity.files) || identity.files.length === 0) {
    errors.push(`${label}.files must be a non-empty array`);
    return errors;
  }
  const seen = new Set();
  identity.files.forEach((entry, index) => {
    const prefix = `${label}.files[${index}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(`${prefix} must be an object`);
      return;
    }
    if (!["directory", "file"].includes(entry.type)) errors.push(`${prefix}.type must be directory or file`);
    if (
      typeof entry.path !== "string"
      || !entry.path
      || path.isAbsolute(entry.path)
      || isOutsideRoot(path.normalize(entry.path))
      || path.normalize(entry.path) !== entry.path
    ) {
      errors.push(`${prefix}.path must be a normalized relative path`);
    } else {
      if (seen.has(entry.path)) errors.push(`${prefix}.path must be unique`);
      seen.add(entry.path);
      if (!taskWorkspaceSurfaceAllowed(entry.path)) errors.push(`${prefix}.path exposes an evaluator-owned or non-fixture eval surface`);
    }
    if (!Number.isInteger(entry.mode) || entry.mode < 0 || entry.mode > 0o777) errors.push(`${prefix}.mode must be a file mode`);
    if (entry.type === "file") {
      if (!Number.isInteger(entry.size) || entry.size < 0) errors.push(`${prefix}.size must be a non-negative integer`);
      if (typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
        errors.push(`${prefix}.sha256 must be a sha256 digest`);
      }
    } else if (entry.size !== undefined || entry.sha256 !== undefined) {
      errors.push(`${prefix} directory entries must not include file size or digest`);
    }
  });
  if (errors.length === 0 && directoryIdentityDigest(identity.files) !== identity.digest) {
    errors.push(`${label}.digest does not match its retained file manifest`);
  }
  return errors;
}

function validateRetainedFilesystemReadIsolation(value, label) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [`${label} must be an enforced filesystem-read-isolation identity`];
  }
  if (value.status !== "enforced") errors.push(`${label}.status must be enforced`);
  if (value.kind !== "codex-permission-profile") errors.push(`${label}.kind must identify the Codex permission profile`);
  if (typeof value.profile !== "string" || !value.profile) errors.push(`${label}.profile must be non-empty`);
  if (value.projectRoot !== "execution-cwd") errors.push(`${label}.projectRoot must bind the current task workspace`);
  if (value.networkAccess !== "denied") errors.push(`${label}.networkAccess must be denied`);
  for (const field of ["policySha256", "environmentPolicySha256"]) {
    if (typeof value[field] !== "string" || !/^[a-f0-9]{64}$/.test(value[field])) {
      errors.push(`${label}.${field} must be a sha256 digest`);
    }
  }
  return errors;
}

function retainedFile(root, relative, label, errors) {
  if (!root) {
    errors.push(`${label} requires a run directory for retained-evidence verification`);
    return null;
  }
  const absolute = path.resolve(root, relative);
  if (isOutsideRoot(path.relative(root, absolute))) {
    errors.push(`${label} must stay inside the run directory`);
    return null;
  }
  try {
    const rootStat = fs.lstatSync(root);
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
      errors.push("run directory must be a regular non-symbolic-link directory");
      return null;
    }
    let current = root;
    for (const segment of path.relative(root, absolute).split(path.sep)) {
      current = path.join(current, segment);
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink()) {
        errors.push(`${label} must not traverse a symbolic link`);
        return null;
      }
    }
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile()) {
      errors.push(`${label} must reference a regular file`);
      return null;
    }
    const rootReal = fs.realpathSync(root);
    const targetReal = fs.realpathSync(absolute);
    if (isOutsideRoot(path.relative(rootReal, targetReal))) {
      errors.push(`${label} resolves outside the run directory`);
      return null;
    }
    const source = fs.readFileSync(targetReal);
    let data;
    try {
      data = JSON.parse(source.toString("utf8"));
    } catch (error) {
      errors.push(`${label} must contain valid JSON (${error.message})`);
      return null;
    }
    return { absolute: targetReal, data, sha256: sha256(source) };
  } catch (_error) {
    errors.push(`${label} does not resolve to a retained regular file`);
    return null;
  }
}

function readRetainedJsonFile(root, relative, label = relative) {
  const errors = [];
  const retained = retainedFile(path.resolve(root), relative, label, errors);
  if (!retained || errors.length > 0) throw new Error(errors.join("; "));
  return retained.data;
}

function validateIndependentReviewArtifact(review, manifest, runDirectory) {
  const errors = [];
  if (!review || typeof review !== "object") return ["independent review must be an object"];
  if (!manifest || typeof manifest !== "object") return ["manifest must be an object"];
  const root = typeof runDirectory === "string" ? path.resolve(runDirectory) : null;
  const retainedManifest = root
    ? retainedFile(root, "manifest.json", "manifest.json", errors)
    : null;
  if (review.schemaVersion !== ARTIFACT_SCHEMA_VERSION) errors.push(`independent review schemaVersion must be ${ARTIFACT_SCHEMA_VERSION}`);
  if (review.runId !== manifest.runId) errors.push("independent review runId must match the manifest");
  if (typeof review.manifestSha256 !== "string" || !/^[a-f0-9]{64}$/.test(review.manifestSha256)) {
    errors.push("independent review manifestSha256 must bind the reviewed manifest");
  } else if (retainedManifest && review.manifestSha256 !== retainedManifest.sha256) {
    errors.push("independent review manifestSha256 does not match the retained manifest");
  }
  const reviewer = typeof review.reviewer === "string" ? review.reviewer.trim().toLowerCase() : "";
  if (!reviewer || reviewer === "unassigned" || reviewer === "unknown") {
    errors.push("independent review reviewer must identify the reviewer");
  }
  const independence = typeof review.independence === "string" ? review.independence.trim().toLowerCase() : "";
  if (!independence || independence === "unassigned" || independence === "unknown") {
    errors.push("independent review independence must state the review boundary");
  }
  if (
    !review.claimAssessment
    || review.claimAssessment.status !== "approved"
    || typeof review.claimAssessment.rationale !== "string"
    || !review.claimAssessment.rationale.trim()
  ) {
    errors.push("independent review claimAssessment must be approved with a rationale");
  }
  const currentManifestGate = manifest.claimCalibration
    && manifest.claimCalibration.status === "pending-independent-review";
  if (!currentManifestGate) {
    errors.push("manifest must use the current pending-independent-review gate; ineligible and legacy runs cannot become claim-ready through review edits");
  }
  const selectedCaseIds = Array.isArray(manifest.selectedCases)
    ? manifest.selectedCases.map((item) => item && item.id)
    : [];
  const uniqueCaseIds = new Set(selectedCaseIds);
  if (
    selectedCaseIds.length === 0
    || selectedCaseIds.some((id) => typeof id !== "string" || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(id))
    || uniqueCaseIds.size !== selectedCaseIds.length
  ) {
    errors.push("manifest selectedCases must contain unique skill/case IDs");
  }
  if (!Number.isInteger(manifest.repeats) || manifest.repeats < 1) {
    errors.push("manifest repeats must be a positive integer");
  }
  if (!Number.isInteger(manifest.trialCount) || manifest.trialCount < 1) {
    errors.push("manifest trialCount must be a positive integer");
  }
  const expectedKeys = new Set();
  if (uniqueCaseIds.size === selectedCaseIds.length && Number.isInteger(manifest.repeats) && manifest.repeats > 0) {
    for (const caseId of selectedCaseIds) {
      for (let trial = 1; trial <= manifest.repeats; trial += 1) expectedKeys.add(`${caseId}#${trial}`);
    }
    if (manifest.trialCount !== expectedKeys.size) {
      errors.push("manifest trialCount must equal selectedCases multiplied by repeats");
    }
  }
  if (!Array.isArray(review.cases) || review.cases.length === 0) {
    errors.push("independent review cases must be a non-empty array");
  } else {
    if (Number.isInteger(manifest.trialCount) && review.cases.length !== manifest.trialCount) {
      errors.push("independent review cases length must equal manifest trialCount");
    }
    const checkReference = (value, label, expected) => {
      if (typeof value !== "string" || !value) {
        errors.push(`${label} must be a non-empty path`);
        return null;
      }
      if (path.normalize(value) !== expected) {
        errors.push(`${label} must match its case and trial path`);
        return null;
      }
      return retainedFile(root, value, label, errors);
    };
    const baselineId = manifest.comparisonEnabled
      && manifest.identities
      && manifest.identities.baseline
      && manifest.identities.baseline.id;
    if (
      manifest.comparisonEnabled
      && (typeof baselineId !== "string" || !/^[a-z0-9-]+$/.test(baselineId) || baselineId === "candidate")
    ) {
      errors.push("comparison manifest must identify a safe, non-candidate baseline artifact ID");
    }
    const seenKeys = new Set();
    review.cases.forEach((item, index) => {
      const prefix = `independent review cases[${index}]`;
      if (!item || typeof item !== "object") {
        errors.push(`${prefix} must be an object`);
        return;
      }
      if (item.status !== "approved") errors.push(`${prefix}.status must be approved`);
      if (typeof item.feedback !== "string" || !item.feedback.trim()) errors.push(`${prefix}.feedback must explain the adjudication`);
      const key = `${item.caseId}#${item.trial}`;
      if (!expectedKeys.has(key)) errors.push(`${prefix} must identify a selected case and repeat`);
      if (seenKeys.has(key)) errors.push(`${prefix} duplicates an earlier case and trial`);
      seenKeys.add(key);
      const [skill, caseId] = typeof item.caseId === "string" ? item.caseId.split("/") : [];
      const trial = Number.isInteger(item.trial) ? String(item.trial).padStart(3, "0") : "invalid";
      const base = path.join("cases", skill || "invalid", caseId || "invalid", `trial-${trial}`);
      const judgment = checkReference(item.judgment, `${prefix}.judgment`, path.join(base, "judgment.json"));
      const candidate = checkReference(
        item.evidence && item.evidence.candidate,
        `${prefix}.evidence.candidate`,
        path.join(base, "candidate", "evidence.json")
      );
      let baseline = null;
      if (manifest.comparisonEnabled) {
        baseline = checkReference(
          item.evidence && item.evidence.baseline,
          `${prefix}.evidence.baseline`,
          path.join(base, baselineId || "invalid", "evidence.json")
        );
      }
      const bindings = item.artifactSha256;
      if (!bindings || typeof bindings !== "object" || Array.isArray(bindings)) {
        errors.push(`${prefix}.artifactSha256 must bind the reviewed retained artifacts`);
      } else {
        for (const [name, retained] of [["judgment", judgment], ["candidate", candidate], ["baseline", baseline]]) {
          if (name === "baseline" && !manifest.comparisonEnabled) continue;
          if (typeof bindings[name] !== "string" || !/^[a-f0-9]{64}$/.test(bindings[name])) {
            errors.push(`${prefix}.artifactSha256.${name} must be a sha256 digest`);
          } else if (retained && bindings[name] !== retained.sha256) {
            errors.push(`${prefix}.artifactSha256.${name} does not match the retained artifact`);
          }
        }
      }
      if (candidate) {
        for (const error of validateRetainedTaskWorkspaceIdentity(
          candidate.data.taskWorkspaceIdentity,
          `${prefix} candidate taskWorkspaceIdentity`
        )) errors.push(error);
        for (const error of validateRetainedFilesystemReadIsolation(
          candidate.data.execution && candidate.data.execution.filesystemReadIsolation,
          `${prefix} candidate filesystemReadIsolation`
        )) errors.push(error);
      }
      if (baseline) {
        for (const error of validateRetainedTaskWorkspaceIdentity(
          baseline.data.taskWorkspaceIdentity,
          `${prefix} baseline taskWorkspaceIdentity`
        )) errors.push(error);
        for (const error of validateRetainedFilesystemReadIsolation(
          baseline.data.execution && baseline.data.execution.filesystemReadIsolation,
          `${prefix} baseline filesystemReadIsolation`
        )) errors.push(error);
      }
      if (
        candidate
        && baseline
        && JSON.stringify(candidate.data.taskWorkspaceIdentity) !== JSON.stringify(baseline.data.taskWorkspaceIdentity)
      ) {
        errors.push(`${prefix} candidate and baseline taskWorkspaceIdentity manifests must match exactly`);
      }
      if (
        candidate
        && baseline
        && JSON.stringify(candidate.data.execution && candidate.data.execution.filesystemReadIsolation)
          !== JSON.stringify(baseline.data.execution && baseline.data.execution.filesystemReadIsolation)
      ) {
        errors.push(`${prefix} candidate and baseline filesystemReadIsolation identities must match exactly`);
      }
      if (judgment) {
        if (judgment.data.caseId !== item.caseId || judgment.data.trial !== item.trial) {
          errors.push(`${prefix}.judgment content must match the reviewed case and trial`);
        }
        if (!judgment.data.contract || judgment.data.contract.evidence !== item.evidence.candidate) {
          errors.push(`${prefix}.judgment contract evidence must match the candidate evidence reference`);
        }
        if (
          manifest.comparisonEnabled
          && (!judgment.data.comparison
            || !judgment.data.comparison.baseline
            || judgment.data.comparison.baseline.evidence !== item.evidence.baseline)
        ) {
          errors.push(`${prefix}.judgment baseline evidence must match the baseline evidence reference`);
        }
      }
    });
    for (const key of expectedKeys) {
      if (!seenKeys.has(key)) errors.push(`independent review is missing ${key}`);
    }
  }
  return errors;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(redactValue(value), null, 2)}\n`, { mode: 0o600 });
}

function persistRunWorkspace(run, targetDirectory) {
  const errors = validateRunArtifact(run);
  if (errors.length > 0) throw new Error(`invalid evaluation run artifact: ${errors.join("; ")}`);
  if (fs.existsSync(targetDirectory)) throw new Error(`${targetDirectory}: evaluation run directory already exists`);
  const parent = path.dirname(targetDirectory);
  fs.mkdirSync(parent, { recursive: true });
  const staging = `${targetDirectory}.staging-${process.pid}-${crypto.randomBytes(4).toString("hex")}`;
  try {
    fs.mkdirSync(staging, { mode: 0o700 });
    const manifest = { ...run };
    delete manifest.results;
    delete manifest.aggregates;
    delete manifest.anomalies;
    const manifestFile = path.join(staging, "manifest.json");
    writeJson(manifestFile, manifest);
    const manifestSha256 = sha256(fs.readFileSync(manifestFile));
    writeJson(path.join(staging, "benchmark.json"), {
      schemaVersion: ARTIFACT_SCHEMA_VERSION,
      reportedDimensions: run.reportedDimensions,
      aggregates: run.aggregates,
      anomalies: run.anomalies
    });

    const reviewCases = [];
    for (const result of run.results) {
      const skill = safeSegment(result.skill, "result skill");
      const caseId = safeSegment(result.id, "result case id");
      const trial = String(result.trial).padStart(3, "0");
      const base = path.join(staging, "cases", skill, caseId, `trial-${trial}`);
      const evidence = {};
      const artifactSha256 = {};
      if (candidateWasAttempted(result)) {
        const candidateFile = path.join(base, "candidate", "evidence.json");
        const candidateIdentity = result.armIdentities && result.armIdentities.candidate
          || run.identities.candidateBySkill && run.identities.candidateBySkill[skill]
          || run.identities.candidate;
        writeJson(candidateFile, evidenceDocument(result, "candidate", candidateIdentity));
        evidence.candidate = path.relative(staging, candidateFile);
        artifactSha256.candidate = sha256(fs.readFileSync(candidateFile));
      }
      if (run.comparisonEnabled && baselineWasAttempted(result)) {
        const baselineIdentity = result.armIdentities && result.armIdentities.baseline || run.identities.baseline;
        const baselineId = safeSegment(baselineIdentity.id, "baseline identity id");
        if (baselineId === "candidate") throw new Error("baseline identity id cannot use the reserved candidate evidence path");
        const baselineFile = path.join(base, baselineId, "evidence.json");
        writeJson(baselineFile, evidenceDocument(result, "baseline", baselineIdentity));
        evidence.baseline = path.relative(staging, baselineFile);
        artifactSha256.baseline = sha256(fs.readFileSync(baselineFile));
      }
      const judgmentFile = path.join(base, "judgment.json");
      writeJson(judgmentFile, trialJudgmentDocument(result, evidence, run.comparisonEnabled));
      artifactSha256.judgment = sha256(fs.readFileSync(judgmentFile));
      reviewCases.push({
        caseId: `${skill}/${caseId}`,
        trial: result.trial,
        status: "pending",
        evidence,
        judgment: path.relative(staging, judgmentFile),
        artifactSha256,
        feedback: "",
        disagreements: []
      });
    }
    writeJson(path.join(staging, "independent-review.json"), {
      schemaVersion: ARTIFACT_SCHEMA_VERSION,
      runId: run.runId,
      manifestSha256,
      reviewer: "unassigned",
      independence: "unknown",
      cases: reviewCases,
      claimAssessment: {
        status: "pending",
        rationale: ""
      },
      overallFeedback: "",
      claimDisagreements: []
    });
    fs.renameSync(staging, targetDirectory);
  } catch (error) {
    fs.rmSync(staging, { recursive: true, force: true });
    throw error;
  }
  return targetDirectory;
}

module.exports = {
  ARTIFACT_SCHEMA_VERSION,
  BASELINE_KINDS,
  FROZEN_TERSE_INSTRUCTION,
  FROZEN_TERSE_INSTRUCTION_VERSION,
  NO_INSTRUCTION_VERSION,
  QUALITY_DIMENSIONS,
  assertionAnomalies,
  boundedText,
  candidateArmIdentity,
  directoryIdentity,
  evidenceDocument,
  isOutsideRoot,
  measurementsForArtifact,
  metricStatistics,
  normalizeBaselineKind,
  outlierAnomalies,
  persistRunWorkspace,
  promptArmIdentity,
  qualityDimensionSummary,
  readRetainedJsonFile,
  redactText,
  redactValue,
  sha256,
  surfaceAnomalies,
  tokenCount,
  trialJudgmentDocument,
  validateIndependentReviewArtifact,
  validateRunArtifact
};
