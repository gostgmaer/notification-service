'use strict';

const { body, query } = require('express-validator');

const PHONE_RE = /^(\+?91)?[6-9]\d{9}$|^\+[1-9]\d{7,14}$/;
const MSG_TYPE = ['TRANSACTIONAL', 'PROMOTIONAL', 'OTP', 'FLASH'];

const sendBulkRules = [
  body('recipients')
    .isArray({ min: 1 })
    .withMessage('recipients must be a non-empty array'),
  body('recipients.*.to')
    .trim()
    .notEmpty()
    .withMessage('Each recipient must have a "to" phone number')
    .matches(PHONE_RE)
    .withMessage('Each "to" must be a valid phone number'),
  body('recipients.*.message')
    .optional()
    .trim()
    .isLength({ max: 1600 })
    .withMessage('Each message must not exceed 1600 characters'),
  body('recipients.*.variables')
    .optional()
    .isObject()
    .withMessage('variables must be an object'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1600 })
    .withMessage('Shared message must not exceed 1600 characters'),
  body('templateId')
    .optional()
    .isMongoId()
    .withMessage('templateId must be a valid ObjectId'),
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
  body()
    .custom((val) => {
      if (!val.message && !val.templateId && !val.templateCode && !val.templateName) {
        throw new Error('Either "message", "templateId", "templateCode", or "templateName" is required at top level or per-recipient');
      }
      return true;
    }),
  body('from')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 }),
  body('messageType')
    .optional()
    .isIn(MSG_TYPE)
    .withMessage(`messageType must be one of: ${MSG_TYPE.join(', ')}`),
  body('batchSize')
    .optional()
    .isInt({ min: 1, max: 500 })
    .toInt()
    .withMessage('batchSize must be 1-500'),
  body('dltTemplateId')
    .optional()
    .trim(),
  body('dltEntityId')
    .optional()
    .trim(),
];

const campaignQueryRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt(),
];

module.exports = {
  sendBulkRules,
  campaignQueryRules,
};
