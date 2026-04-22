require('dotenv').config();
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { ValidationPipe } = require('@nestjs/common');

// Reuse app instance across warm invocations (serverless connection reuse)
let app;

async function getApp() {
  if (app) return app;

  app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const helmet = require('helmet');
  const compression = require('compression');

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-tenant-id', 'x-app', 'x-app-url', 'x-path'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Required for Vercel — do not call app.listen()
  await app.init();

  return app;
}

module.exports = async (req, res) => {
  const server = await getApp();
  const expressApp = server.getHttpAdapter().getInstance();
  expressApp(req, res);
};
