import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// 1. Create the Express instance
const server = express();

async function bootstrap(expressInstance: any) {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api');

  // For Vercel, we use .init() instead of .listen()
  await app.init();
}

// 2. Start the bootstrap process
bootstrap(server).catch((err) => {
  console.error('Failed to bootstrap app', err);
});

// 3. CRITICAL: Export the server for Vercel to find
export default server;
