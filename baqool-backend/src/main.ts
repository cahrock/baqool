import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS for Expo Web / Mobile and local dev
  app.enableCors({
    origin: [
      'http://localhost:8081',  // older Expo web port
      'http://localhost:19006', // current Expo web port
      'http://localhost:3000',  // generic web dev
      'http://localhost:3001',  // generic web dev
      'http://localhost:4000',  // generic web dev
      'http://localhost:5173',  // Vite
    ],
    credentials: false,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // strips unknown fields
      forbidNonWhitelisted: true, // throws if unknown fields are sent
      transform: true,            // transforms payloads to DTO types
    }),
  );

  await app.listen(4000, '0.0.0.0'); // <— important for devices on your network
  console.log(`✅ API listening on http://localhost:3000`);
}

bootstrap();
