import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { JsonLogger } from "./common/observability/json-logger";

async function bootstrap() {
  const logger = new JsonLogger();
  const app = await NestFactory.create(AppModule, { logger });
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: configService.get("CORS_ORIGIN", "*"),
    credentials: true,
  });

  // Global validation pipe
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

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("BEYU Health OS API")
    .setDescription("Enterprise Healthcare API Documentation")
    .setVersion("1.0.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "access-token",
    )
    .addTag("auth", "Authentication endpoints")
    .addTag("patients", "Patient management")
    .addTag("clinical", "Clinical data")
    .addTag("appointments", "Appointment scheduling")
    .addTag("billing", "Billing and payments")
    .addTag("lab", "Laboratory services")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = configService.get("PORT", 3000);
  await app.listen(port);
  logger.log(`API running`, {
    service: "beyu-health-os",
    port,
    env: process.env.NODE_ENV ?? "development",
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
