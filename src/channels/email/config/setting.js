/**
 * Shim for emailTemplate.js compatibility.
 * Re-exports app-level config values from env.js.
 */
const env = require('./env');

const dbUrl           = env.MONGO_URL;
const environment     = env.NODE_ENV;
const appUrl          = env.APP_URL;
const applicationName = env.APPLICATION_NAME;

module.exports = {
  dbUrl,
  environment,
  appUrl,
  applicationName,
  // Legacy aliases used by emailTemplate.js
  enviroment:    environment,
  applicaionName: applicationName,
};
