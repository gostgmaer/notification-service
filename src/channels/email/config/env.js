/**
 * Shim for emailTemplate.js compatibility.
 * NestJS loads .env via ConfigModule — we just read process.env here.
 */
const env = {
  NODE_ENV:           process.env.NODE_ENV || 'development',
  PORT:               parseInt(process.env.PORT) || 4000,
  APP_URL:            process.env.APP_URL || process.env.APPURL || '',
  APPLICATION_NAME:   process.env.APPLICATION_NAME || process.env.DEFAULT_FROM_NAME || 'Notification Service',
  MONGO_URL:          process.env.MONGODB_URI || process.env.MONGO_URL || '',
  EMAIL_FROM:         process.env.EMAIL_FROM || process.env.DEFAULT_FROM_EMAIL || '',
  DEFAULT_FROM_EMAIL: process.env.DEFAULT_FROM_EMAIL || '',
  DEFAULT_FROM_NAME:  process.env.DEFAULT_FROM_NAME || '',
};

module.exports = env;
