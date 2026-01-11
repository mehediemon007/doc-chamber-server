import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';

const server = express();
let cachedApp: any; // Variable to store the initialized app

export const bootstrap = async () => {
  // If app is already initialized, don't do it again
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.setGlobalPrefix('api');

    await app.init();
    cachedApp = app; // Store it for the next request
  }
  return server;
};

export default async (req: Request, res: Response) => {
  await bootstrap();
  server(req, res);
};
