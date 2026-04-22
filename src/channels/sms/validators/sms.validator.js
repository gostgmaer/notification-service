'use strict';

const { body, param, query } = require('express-validator');

const PHONE_RE = /^(\+?91)?[6-9]\d{9}$|^\+[1-9]\d{7,14}$/;
const MSG_TYPE = ['TRANSACTIONAL', 'PROMOTIONAL', 'OTP', 'FLASH'];

const sendSmsRules = [
  body('to')
    .trim()
    .notEmpty()
    .withMessage('Recipient phone number is required')
    .matches(PHONE_RE)
    .withMessage('Phone number must be E.164 or valid 10-digit Indian number'),
  body('message')
    .if((value, { req }) => !req.body.templateId && !req.body.templateCode && !req.body.templateName)
    .trim()
    .notEmpty()
    .withMessage('Message body is required when not using a template')
    .isLength({ max: 1600 })
    .withMessage('Message must not exceed 1600 characters'),
  body('from')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Sender ID must be 2-20 characters'),
  body('messageType')
    .optional()
    .isIn(MSG_TYPE)
    .withMessage(`messageType must be one of: ${MSG_TYPE.join(', ')}`),
  body('referenceId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('referenceId must not exceed 100 characters'),
  body('templateId')
    .optional()
    .isMongoId()
    .withMessage('templateId must be a valid MongoDB ObjectId'),
  body('templateCode')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('templateCode must be 2-100 characters')
    .matches(/^[A-Z0-9_]+$/i)
    .withMessage('templateCode must contain only letters, numbers, and underscores'),
  body('templateName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('templateName must be 2-100 characters'),
  body('variables')
    .optional()
    .isObject()
    .withMessage('variables must be an object'),
  body('dltTemplateId')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  body('dltEntityId')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  body('unicode')
    .optional()
    .isBoolean()
    .withMessage('unicode must be a boolean'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('scheduledAt must be a valid ISO 8601 datetime')
    .custom((val) => {
      if (new Date(val) <= new Date()) throw new Error('scheduledAt must be in the future');
      return true;
    }),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('metadata must be an object'),
];

const sendOtpRules = [
  body('to')
    .trim()
    .notEmpty()
    .withMessage('Recipient phone number is required')
    .matches(PHONE_RE)
    .withMessage('Invalid phone number'),
  body('otpLength')
    .optional()
    .isInt({ min: 4, max: 8 })
    .withMessage('OTP length must be 4-8 digits'),
  body('expiresInMinutes')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('OTP expiry must be 1-60 minutes'),
  body('templateId')
    .optional()
    .isMongoId()
    .withMessage('templateId must be a valid ObjectId'),
  body('referenceId')
    .optional()
    .trim()
    .isLength({ max: 100 }),
];

const verifyOtpRules = [
  body('to')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(PHONE_RE)
    .withMessage('Invalid phone number'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 4, max: 8 })
    .withMessage('OTP must be 4-8 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
  body('referenceId')
    .optional()
    .trim(),
];

const getMessageRules = [
  param('messageId')
    .trim()
    .notEmpty()
    .withMessage('messageId is required'),
];

const listMessagesRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('limit must be 1-100'),
  query('status')
    .optional()
    .isIn(['QUEUED', 'SENT', 'FAILED', 'DELIVERED', 'UNDELIVERED', 'RETRYING'])
    .withMessage('Invalid status filter'),
  query('from')
    .optional()
    .isISO8601()
    .withMessage('from must be ISO 8601 date'),
  query('to')
    .optional()
    .isISO8601()
    .withMessage('to must be ISO 8601 date'),
];

module.exports = {
  sendSmsRules,
  sendOtpRules,
  verifyOtpRules,
  getMessageRules,
  listMessagesRules,
};
