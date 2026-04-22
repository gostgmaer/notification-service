'use strict';

const { body, param } = require('express-validator');

const MSG_TYPE = ['TRANSACTIONAL', 'PROMOTIONAL', 'OTP', 'FLASH'];

const createTemplateRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Template name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Code must be 2-100 characters')
    .matches(/^[A-Z0-9_]+$/i)
    .withMessage('Code may only contain letters, numbers, and underscores')
    .customSanitizer(value => value ? value.toUpperCase() : value),
  body('body')
    .trim()
    .notEmpty()
    .withMessage('Template body is required')
    .isLength({ max: 1600 })
    .withMessage('Body must not exceed 1600 characters'),
  body('category')
    .optional()
    .isIn(MSG_TYPE)
    .withMessage(`category must be one of: ${MSG_TYPE.join(', ')}`),
  body('dltTemplateId')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  body('dltEntityId')
    .optional()
    .trim()
    .isLength({ max: 50 }),
  body('variables')
    .optional()
    .isArray()
    .withMessage('variables must be an array'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('metadata must be an object'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const updateTemplateRules = [
  param('templateId')
    .isMongoId()
    .withMessage('templateId must be a valid ObjectId'),
  ...createTemplateRules.map((rule) => {
    // Make all body validators optional for PATCH
    const opt = rule.optional ? rule.optional() : rule;
    return opt;
  }),
];

const getTemplateRules = [
  param('templateId')
    .isMongoId()
    .withMessage('templateId must be a valid ObjectId'),
];

module.exports = {
  createTemplateRules,
  updateTemplateRules,
  getTemplateRules,
};
