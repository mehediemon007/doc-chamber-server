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

// For Local Development
// if (process.env.NODE_ENV !== 'production') {
//   // Use 'void' to satisfy the "no-floating-promises" rule
//   void (async () => {
//     try {
//       await bootstrap();
//       const port = process.env.PORT ?? 3000;
//       server.listen(port, () => {
//         console.log(
//           `🚀 Local Server listening on http://localhost:${port}/api`,
//         );
//       });
//     } catch (err) {
//       console.error('❌ Error during local bootstrap:', err);
//     }
//   })();
// }

if (process.env.NODE_ENV !== 'production') {
  async function startLocal() {
    try {
      // For local, we create a standard Nest Application directly
      // This avoids the 'function-wrap' overhead and uses Nest's native listener
      const app = await NestFactory.create(AppModule);

      app.enableCors();
      app.useGlobalPipes(
        new ValidationPipe({ transform: true, whitelist: true }),
      );
      app.setGlobalPrefix('api');

      const port = process.env.PORT ?? 3000;
      await app.listen(port);
      console.log(`🚀 Fast Local Server: http://localhost:${port}/api`);
    } catch (err) {
      console.error('❌ Error:', err);
    }
  }
  void startLocal();
}
