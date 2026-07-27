import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || '*',
    credentials: true,
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger/OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FIIM API')
    .setDescription('Fatigue Injury Index Monitoring API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & Authorization')
    .addTag('Users', 'User Management')
    .addTag('Athletes', 'Athlete Management')
    .addTag('Wellness', 'Wellness Surveys')
    .addTag('Training Load', 'Training Load Tracking')
    .addTag('Calculations', 'Algorithm & Calculations')
    .addTag('Injuries', 'Injury Management')
    .addTag('Alerts', 'Alerting System')
    .addTag('Reports', 'Reporting')
    .addTag('Dashboard', 'Dashboard Metrics')
    .addTag('Import', 'Data Import')
    .addTag('Audit', 'Audit Logging')
    .addTag('Admin', 'System Administration')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  
  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                    FIIM API Server                         ║
  ╠════════════════════════════════════════════════════════════╣
  ║  Environment: ${configService.get('NODE_ENV', 'development').padEnd(46)}║
  ║  Port:       ${port.toString().padEnd(46)}║
  ║  API Base:   http://localhost:${port}/api/v1${' '.repeat(port.toString().length === 4 ? 12 : 11)}║
  ║  Swagger:    http://localhost:${port}/api/docs${' '.repeat(port.toString().length === 4 ? 14 : 13)}║
  ╚════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
