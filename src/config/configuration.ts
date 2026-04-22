export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiKey: process.env.API_KEY || '',
  defaultTenantId: process.env.DEFAULT_TENANT_ID || null,

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/notification-service',
  },

  redis: {
    url: process.env.REDIS_URL || '',
    password: process.env.REDIS_PASSWORD || undefined,
  },

  bull: {
    enabled: process.env.ENABLE_BULL === 'true',
    concurrencySms: parseInt(process.env.BULL_CONCURRENCY_SMS, 10) || 5,
    concurrencyEmail: parseInt(process.env.BULL_CONCURRENCY_EMAIL, 10) || 10,
  },

  kafka: {
    enabled: process.env.ENABLE_KAFKA === 'true',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    groupId: process.env.KAFKA_GROUP_ID || 'notification-service',
    clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
    topics: {
      smsSend: process.env.KAFKA_TOPIC_SMS_SEND || 'sms.notification.send',
      smsDelivered: process.env.KAFKA_TOPIC_SMS_DELIVERED || 'sms.notification.delivered',
      smsFailed: process.env.KAFKA_TOPIC_SMS_FAILED || 'sms.notification.failed',
      emailSend: process.env.KAFKA_TOPIC_EMAIL_SEND || 'email.notification.send',
      emailDelivered: process.env.KAFKA_TOPIC_EMAIL_DELIVERED || 'email.notification.delivered',
      emailFailed: process.env.KAFKA_TOPIC_EMAIL_FAILED || 'email.notification.failed',
    },
  },

  cache: {
    enabled: process.env.ENABLE_CACHE === 'true',
    ttlSmsTemplate: 3600,    // 1 hour
    ttlEmailTemplate: 7200,  // 2 hours
    ttlAnalytics: 60,        // 1 minute (keep short — live data)
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },

  sms: {
    defaultProvider: process.env.SMS_DEFAULT_PROVIDER || 'mock',
    fallbackProvider: process.env.SMS_FALLBACK_PROVIDER || '',
    retryAttempts: parseInt(process.env.SMS_RETRY_ATTEMPTS, 10) || 3,
    retryDelayMs: parseInt(process.env.SMS_RETRY_DELAY_MS, 10) || 5000,
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    service: process.env.EMAIL_SERVICE || '',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',
    fromName: process.env.DEFAULT_FROM_NAME || process.env.EMAIL_FROM_NAME || 'Notifications',
    maxConnections: parseInt(process.env.EMAIL_MAX_CONNECTIONS, 10) || 5,
    maxMessages: parseInt(process.env.EMAIL_MAX_MESSAGES, 10) || 100,
    rateDelta: parseInt(process.env.EMAIL_RATE_DELTA, 10) || 1000,
    rateLimit: parseInt(process.env.EMAIL_RATE_LIMIT, 10) || 5,
    tlsRejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
    tlsMinVersion: process.env.EMAIL_TLS_MIN_VERSION || 'TLSv1.2',
    debug: process.env.EMAIL_DEBUG === 'true',
    fallback: {
      host: process.env.FALLBACK_EMAIL_HOST || '',
      service: process.env.FALLBACK_EMAIL_SERVICE || '',
      port: parseInt(process.env.FALLBACK_EMAIL_PORT, 10) || 587,
      secure: process.env.FALLBACK_EMAIL_SECURE === 'true',
      user: process.env.FALLBACK_EMAIL_USER || '',
      pass: process.env.FALLBACK_EMAIL_PASS || '',
    },
    oauth2: {
      clientId: process.env.OAUTH2_CLIENT_ID || '',
      clientSecret: process.env.OAUTH2_CLIENT_SECRET || '',
      redirectUri: process.env.OAUTH2_REDIRECT_URI || '',
      refreshToken: process.env.OAUTH2_REFRESH_TOKEN || '',
    },
  },
});
