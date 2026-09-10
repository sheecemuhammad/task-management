import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RealtimeSocketGatewayService } from './common/realtime/gateway/realtime-socket-gateway.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const realtimeGateway = app.get(RealtimeSocketGatewayService);

  realtimeGateway.initialize(app.getHttpServer());

  // -----------------------------------------
  // Config
  // -----------------------------------------
  const configService = app.get(ConfigService);

  const port = configService.get<number>('app.port') ?? 3000;

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

  console.log(`Application running on: http://localhost:${port}`);

  console.log(`Swagger running on: http://localhost:${port}/api`);
}

bootstrap();
