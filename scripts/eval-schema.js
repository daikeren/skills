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
  validateStringArray(errors, data.negativePrompts, "negativePrompts", 0);
  validateStringArray(errors, data.traceExpectations, "traceExpectations", 1);

  const negativeRoutes = data.negativeRoutes === undefined ? [] : data.negativeRoutes;
  if (!Array.isArray(negativeRoutes)) {
    errors.push("negativeRoutes must be an array");
  } else {
    negativeRoutes.forEach((route, index) => {
      const prefix = `negativeRoutes[${index}]`;
      if (!isObject(route)) {
        errors.push(`${prefix} must be an object`);
        return;
      }
      if (!isNonEmptyString(route.prompt)) {
        errors.push(`${prefix}.prompt must be a non-empty string`);
      }
      if (!isNonEmptyString(route.expectedSkill)) {
        errors.push(`${prefix}.expectedSkill must be a non-empty string`);
      } else if (isNonEmptyString(data.skill) && route.expectedSkill === data.skill) {
        errors.push(`${prefix}.expectedSkill must differ from the top-level skill`);
      }
    });
  }
  const negativePromptCount = (Array.isArray(data.negativePrompts) ? data.negativePrompts.length : 0)
    + (Array.isArray(negativeRoutes) ? negativeRoutes.length : 0);
  if (negativePromptCount < 2) {
    errors.push("negativePrompts and negativeRoutes must contain at least two prompts in total");
  }

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

function validateEvalCoverage(skillNames, datasets) {
  const errors = [];
  const expected = new Set(skillNames);
  if (expected.size === 0) {
    return ["no skills found for eval coverage"];
  }
  if (datasets.length === 0) {
    return [`expected one eval dataset for each of ${expected.size} skill(s); found none`];
  }

  const bySkill = new Map();
  datasets.forEach((dataset, index) => {
    const label = dataset.file || `dataset[${index}]`;
    if (!isNonEmptyString(dataset.skill)) {
      errors.push(`${label}: dataset skill must be a non-empty string`);
      return;
    }
    if (!expected.has(dataset.skill)) {
      errors.push(`${label}: skill ${dataset.skill} has no matching skill directory`);
    }
    for (const boundarySkill of dataset.expectedSkills || []) {
      if (!expected.has(boundarySkill)) {
        errors.push(`${label}: boundary target ${boundarySkill} has no matching skill directory`);
      }
    }
    const labels = bySkill.get(dataset.skill) || [];
    labels.push(label);
    bySkill.set(dataset.skill, labels);
  });

  for (const skill of expected) {
    const labels = bySkill.get(skill) || [];
    if (labels.length === 0) {
      errors.push(`skill ${skill} is missing an eval dataset`);
    } else if (labels.length > 1) {
      errors.push(`skill ${skill} has duplicate eval datasets: ${labels.join(", ")}`);
    }
  }
  return errors;
}

module.exports = {
  isNonEmptyString,
  validateEvalCoverage,
  validateEvalData
};
