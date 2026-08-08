import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // ── Global prefix ──
  app.setGlobalPrefix('api/v1');

  // ── CORS ──
  app.enableCors({
    origin: true, // Allow all origins temporarily for development/cloud IDEs
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ── Global validation ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // strip unknown properties
      forbidNonWhitelisted: false, // allow extra fields (frontend may send more)
      transform: true,            // auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 SafeDeal API running on port ${port}/api/v1`);
}

bootstrap();
