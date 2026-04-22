const Joi = require('joi');

// ─── Shared field definitions ───────────────────────────────────────────────

const emailField = Joi.string().email();
const emailListField = Joi.alternatives().try(
  Joi.string().email().required(),
  Joi.array().items(Joi.string().email()).min(1).required()
);

const templateField = Joi.string()
  .pattern(/^[a-zA-Z0-9_-]+$/)
  .min(1)
  .max(100);

const attachmentSchema = Joi.object({
  filename: Joi.string().required(),
  content: Joi.alternatives().try(Joi.string(), Joi.binary()).required(),
  contentType: Joi.string().optional(),
  encoding: Joi.string().optional()
});

const baseEmailFields = {
  to: emailListField.required(),
  from: emailField.optional(),
  template: templateField.optional(),
  templateId: templateField.optional(),
  data: Joi.object().unknown(true).optional().default({}),
  idempotencyKey: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(1).max(255).optional(),
  cc: Joi.alternatives().try(emailField, Joi.array().items(emailField)).optional(),
  bcc: Joi.alternatives().try(emailField, Joi.array().items(emailField)).optional(),
  attachments: Joi.array().items(attachmentSchema).optional(),
  timestamp: Joi.string().isoDate().optional(),
  retryCount: Joi.number().integer().min(0).optional()
};

// ─── Schemas ────────────────────────────────────────────────────────────────

// HTTP request payload — requestId is optional (server generates it)
const emailPayloadSchema = Joi.object({
  ...baseEmailFields,
  requestId: Joi.string().optional()
}).or('template', 'templateId');

// Kafka message — requestId is required (already assigned by the API layer)
const kafkaMessageSchema = Joi.object({
  ...baseEmailFields,
  requestId: Joi.string().required()
}).or('template', 'templateId');

// ─── Validators ─────────────────────────────────────────────────────────────

const VALIDATION_OPTIONS = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true
};

function validateEmailPayload(payload) {
  return emailPayloadSchema.validate(payload, VALIDATION_OPTIONS);
}

function validateKafkaMessage(payload) {
  return kafkaMessageSchema.validate(payload, VALIDATION_OPTIONS);
}

module.exports = {
  validateEmailPayload,
  validateKafkaMessage
};
