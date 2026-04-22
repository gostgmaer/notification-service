'use strict';

const { parsePhoneNumber, isValidPhoneNumber, parsePhoneNumberFromString } = require('libphonenumber-js');

/**
 * Normalise a phone number to E.164 format (+919876543210).
 * Handles bare 10-digit Indian numbers by defaulting to +91.
 * @param {string} phone
 * @param {string} [defaultCountry='IN']
 * @returns {{ e164: string, countryCode: string, isValid: boolean }}
 */
function normalisePhone(phone, defaultCountry = 'IN') {
  if (!phone || typeof phone !== 'string') {
    return { e164: '', countryCode: '', isValid: false };
  }

  const cleaned = phone.trim();

  try {
    const parsed = parsePhoneNumberFromString(cleaned, defaultCountry);
    if (!parsed || !parsed.isValid()) {
      return { e164: cleaned, countryCode: '', isValid: false };
    }
    return {
      e164: parsed.format('E.164'),
      countryCode: parsed.country || '',
      isValid: true,
    };
  } catch {
    return { e164: cleaned, countryCode: '', isValid: false };
  }
}

/**
 * Mask a phone number for logging — show last 4 digits only.
 * +919876543210 → +91987****210
 */
function maskPhone(phone) {
  if (!phone || phone.length < 8) return '****';
  const visible = 4;
  const prefix = phone.slice(0, phone.length - visible - 4);
  const suffix = phone.slice(-visible);
  return `${prefix}****${suffix}`;
}

/**
 * Validate that a string is a plausible phone number.
 */
function isValidPhone(phone, defaultCountry = 'IN') {
  const { isValid } = normalisePhone(phone, defaultCountry);
  return isValid;
}

module.exports = { normalisePhone, maskPhone, isValidPhone };

