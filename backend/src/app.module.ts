import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EstudiantesModule } from './estudiantes/estudiantes.module';
import { AsesoresModule } from './asesores/asesores.module';
import { EmpresasModule } from './empresas/empresas.module';
import { OfertasModule } from './ofertas/ofertas.module';
import { SeguimientoModule } from './seguimiento/seguimiento.module';
import { PracticasModule } from './practicas/practicas.module';
import { TesisModule } from './tesis/tesis.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportesModule } from './reportes/reportes.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { UploadsModule } from './uploads/uploads.module';
import { PrismaModule } from 'prisma/prisma.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EstudiantesModule,
    AsesoresModule,
    EmpresasModule,
    OfertasModule,
    SeguimientoModule,
    PracticasModule,
    TesisModule,
    DashboardModule,
    ReportesModule,
    NotificacionesModule,
    UploadsModule,
  ],
})
export class AppModule {}