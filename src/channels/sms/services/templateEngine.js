'use strict';

const PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g;
const GSM7_LIMIT_SINGLE = 160;
const GSM7_LIMIT_MULTI = 153;
const UNICODE_LIMIT_SINGLE = 70;
const UNICODE_LIMIT_MULTI = 67;

/**
 * Render a template body by replacing {{variable}} placeholders.
 * @param {string} body  - Template body with {{var}} placeholders
 * @param {Object} vars  - Variable map { varName: value }
 * @returns {string}
 */
function render(body, vars = {}) {
  return body.replace(PLACEHOLDER_REGEX, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`;
  });
}

/**
 * Extract variable names from a template body.
 * @param {string} body
 * @returns {string[]}
 */
function extractVariables(body) {
  const found = new Set();
  let match;
  const re = /\{\{(\w+)\}\}/g;
  while ((match = re.exec(body)) !== null) {
    found.add(match[1]);
  }
  return [...found];
}

/**
 * Validate that all required variables are present.
 * @param {string[]} required
 * @param {Object}   provided
 * @returns {{ valid: boolean, missing: string[] }}
 */
function validateVariables(required, provided = {}) {
  const missing = required.filter((k) => provided[k] === undefined);
  return { valid: missing.length === 0, missing };
}

/**
 * Determine if a string contains non-GSM7 characters (needs Unicode).
 */
function isUnicode(text) {
  // GSM-7 basic + extended character set
  const gsm7 = /^[\x00-\x7F\u00A3\u00A5\u00E8\u00E9\u00F9\u00EC\u00F2\u00C7\u00C5\u00E5\u0394\u03A6\u0393\u039B\u03A9\u03A0\u03A8\u03A3\u0398\u039E\u00C6\u00E6\u00DF\u00C9\u00A4\u00F3\u00FA\u00E1\u00ED\u00F3\u00FA\u00E7\u00F1\u00DC\u00F6\u00FC\u00E4\u00E0\u00BF\u00A1]*$/;
  return !gsm7.test(text);
}

/**
 * Calculate message length and segment count.
 */
function calculateSegments(text) {
  const unicode = isUnicode(text);
  const len = text.length;
  const singleLimit = unicode ? UNICODE_LIMIT_SINGLE : GSM7_LIMIT_SINGLE;
  const multiLimit = unicode ? UNICODE_LIMIT_MULTI : GSM7_LIMIT_MULTI;
  const segments = len <= singleLimit ? 1 : Math.ceil(len / multiLimit);
  return { messageLength: len, segmentCount: segments, unicode };
}

module.exports = { render, extractVariables, validateVariables, calculateSegments, isUnicode };

