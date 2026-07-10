"use strict";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateStringArray(errors, value, field, minimum) {
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array`);
    return;
  }
  if (value.length < minimum) {
    errors.push(`${field} must contain at least ${minimum} item(s)`);
  }
  value.forEach((item, index) => {
    if (!isNonEmptyString(item)) {
      errors.push(`${field}[${index}] must be a non-empty string`);
    }
  });
}

function validateEvalData(data) {
  const errors = [];
  if (!isObject(data)) {
    return ["top level must be an object"];
  }

  if (!isNonEmptyString(data.skill)) {
    errors.push("skill must be a non-empty string");
  }
  if (!Number.isInteger(data.version) || data.version < 1) {
    errors.push("version must be a positive integer");
  }
  if (!isNonEmptyString(data.purpose)) {
    errors.push("purpose must be a non-empty string");
  }

  validateStringArray(errors, data.positivePrompts, "positivePrompts", 2);
  validateStringArray(errors, data.negativePrompts, "negativePrompts", 2);
  validateStringArray(errors, data.traceExpectations, "traceExpectations", 1);

  if (data.fixtures !== undefined) {
    errors.push("fixtures must be declared per case, not at the file top level");
  }

  if (!Array.isArray(data.cases)) {
    errors.push("cases must be an array");
    return errors;
  }
  if (data.cases.length === 0) {
    errors.push("cases must contain at least one case");
  }

  const caseIds = new Set();
  data.cases.forEach((item, index) => {
    const prefix = `cases[${index}]`;
    if (!isObject(item)) {
      errors.push(`${prefix} must be an object`);
      return;
    }
    if (!isNonEmptyString(item.id)) {
      errors.push(`${prefix}.id must be a non-empty string`);
    } else if (caseIds.has(item.id)) {
      errors.push(`${prefix}.id must be unique; duplicate ${item.id}`);
    } else {
      caseIds.add(item.id);
    }
    if (!isNonEmptyString(item.prompt)) {
      errors.push(`${prefix}.prompt must be a non-empty string`);
    }
    if (!isNonEmptyString(item.expectedSkill)) {
      errors.push(`${prefix}.expectedSkill must be a non-empty string`);
    } else if (isNonEmptyString(data.skill) && item.expectedSkill !== data.skill) {
      errors.push(`${prefix}.expectedSkill must match top-level skill`);
    }
    validateStringArray(errors, item.checks, `${prefix}.checks`, 2);
    if (item.fixtures !== undefined) {
      validateStringArray(errors, item.fixtures, `${prefix}.fixtures`, 1);
    }
  });

  return errors;
}

module.exports = {
  isNonEmptyString,
  validateEvalData
};
