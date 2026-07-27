export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL,
  },
  
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL,
  },
  
  minio: {
    endpoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.MINIO_BUCKET || 'fiim-uploads',
    useSsl: process.env.MINIO_USE_SSL === 'true',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiration: process.env.JWT_EXPIRATION || '4h',
    refreshExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  },
  
  mfa: {
    issuer: process.env.MFA_ISSUER || 'FIIM',
    algorithm: process.env.MFA_ALGORITHM || 'sha256',
  },
  
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    },
  },
  
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    fromEmail: process.env.FROM_EMAIL || 'noreply@fiim.local',
    fromName: process.env.FROM_NAME || 'FIIM System',
  },
  
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  
  api: {
    url: process.env.API_URL || 'http://localhost:3000',
  },
  
  features: {
    enableMfa: process.env.ENABLE_MFA !== 'false',
    enableOAuth: process.env.ENABLE_OAUTH !== 'false',
    enableRealtimeAlerts: process.env.ENABLE_REALTIME_ALERTS !== 'false',
    enableAdvancedAnalytics: process.env.ENABLE_ADVANCED_ANALYTICS === 'true',
    enableMobilePwa: process.env.ENABLE_MOBILE_PWA !== 'false',
  },
  
  compliance: {
    encryptionKey: process.env.ENCRYPTION_KEY,
    auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '2555', 10),
    dataRetentionYears: parseInt(process.env.DATA_RETENTION_YEARS || '7', 10),
  },
  
  monitoring: {
    datadogApiKey: process.env.DATADOG_API_KEY,
    newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY,
  },
  
  logLevel: process.env.LOG_LEVEL || 'info',
});
