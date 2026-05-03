import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { PrismaService } from 'prisma/prisma.service';
import { main } from '../prisma/seed';

// Ajusta el path si es necesario
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.setGlobalPrefix('api');

  const port = parseInt(process.env.PORT || '3001', 10);
  const host = '0.0.0.0';

  await app.listen(port, host); // ✅ Puerto abierto PRIMERO

  console.log(`🚀 Servidor corriendo en http://${host}:${port}`);
  console.log(`📡 API: http://${host}:${port}/api`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);

  // ✅ Seed DESPUÉS de que el servidor ya está escuchando
  try {
    console.log('🌱 Verificando seed de datos...');
    await main();
  } catch (error) {
    console.error('⚠️ Seed falló (no crítico):', error.toString());
  }
}

bootstrap().catch((error) => {
  console.error('❌ Error al iniciar la aplicación:', error);
  process.exit(1);
});