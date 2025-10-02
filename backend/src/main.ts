import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
    exposedHeaders: ["Authorization"],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle("Uber Backend API")
    .setDescription(
      "The Uber application backend API with multi-file Prisma schema"
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("auth", "Authentication endpoints")
    .addTag("users", "User management")
    .addTag("rides", "Ride management")
    .addTag("payments", "Payment processing")
    .addTag("notifications", "Notification system")
    .addTag("chat", "Chat and messaging")
    .addTag("locations", "Location services")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
