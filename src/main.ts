import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RealtimeSocketGatewayService } from './common/realtime/gateway/realtime-socket-gateway.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const realtimeGateway = app.get(RealtimeSocketGatewayService);

  realtimeGateway.initialize(app.getHttpServer());

  // -----------------------------------------
  // Config
  // -----------------------------------------
  const configService = app.get(ConfigService);

  const port = configService.get<number>('app.port') ?? 3000;
  const frontendUrl =
    configService.get<string>('app.frontendUrl') ?? 'http://localhost:3000';

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // -----------------------------------------
  // Global Validation
  // -----------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  // -----------------------------------------
  // Swagger
  // -----------------------------------------
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription(
      'API for managing teams, tasks, comments, attachments, authentication, and public sharing.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api', app, document);

  // -----------------------------------------
  // Start Server
  // -----------------------------------------
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Application running on: http://localhost:${port}`);
  logger.log(`Swagger running on: http://localhost:${port}/api`);
}

bootstrap();
