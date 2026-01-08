import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically removes properties not in the DTO
      forbidNonWhitelisted: true, // Throws error if extra properties are sent
      transform: true, // Automatically transforms payloads to DTO instances
    }),
  );

  // This allows you to visit http://localhost:3000/uploads/... in browser
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  (app as any).useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
