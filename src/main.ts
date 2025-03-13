import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { INestApplication } from "@nestjs/common";

/* Main entry point for the NestJS GPU Stock Checker API.
 * This file bootstraps the application, configures middleware, and starts the HTTP server. */
async function bootstrap() {
  /* Bootstrap function to initialize and start the NestJS application.
   * Creates the application instance, configures global middleware, and starts the HTTP server. */
  const app: INestApplication<any> = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes();

  // Start the HTTP server on port 3000.
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}

bootstrap();