import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from './config/config.module.js';
import { ConfigService } from './config/config.service.js';
import { SecurityModule } from './security/security.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuditModule } from './audit/audit.module.js';
import { MetricsModule } from './metrics/metrics.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { DevicesModule } from './devices/devices.module.js';
import { PermisosModule } from './permisos/permisos.module.js';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module.js';
import { GeoModule } from './geo/geo.module.js';
import { ComerciosModule } from './comercios/comercios.module.js';
import { RegionalesModule } from './regionales/regionales.module.js';
import { SucursalesModule } from './sucursales/sucursales.module.js';
import { EquiposModule } from './equipos/equipos.module.js';
import { ProductosModule } from './productos/productos.module.js';
import { ServiciosModule } from './servicios/servicios.module.js';
import { CajasModule } from './cajas/cajas.module.js';
import { VentasModule } from './ventas/ventas.module.js';
import { ClientesModule } from './clientes/clientes.module.js';
import { InventarioModule } from './inventario/inventario.module.js';
import { GirosModule } from './giros/giros.module.js';
import { RecaudosModule } from './recaudos/recaudos.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';
import { SigmaModule } from './sigma/sigma.module.js';
import { SacasModule }         from './sacas/sacas.module.js';
import { EnviosMasivosModule } from './envios-masivos/envios-masivos.module.js';
import { FranquiciasModule }   from './franquicias/franquicias.module.js';
import { TesoreriaModule }     from './tesoreria/tesoreria.module.js';
import { AuditInterceptor } from './audit/audit.interceptor.js';
import { AuditContextInterceptor } from './common/interceptors/audit-context.interceptor.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.mongoUri,
        serverSelectionTimeoutMS: 5000,
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    ScheduleModule.forRoot(),
    PrismaModule, AuditModule, MetricsModule, HealthModule,
    AuthModule, UsersModule, DevicesModule, PermisosModule, FeatureFlagsModule,
    GeoModule, ComerciosModule, RegionalesModule, SucursalesModule, EquiposModule,
    ProductosModule, ServiciosModule, CajasModule, VentasModule, ClientesModule,
    InventarioModule, GirosModule, RecaudosModule, RealtimeModule, SigmaModule, SacasModule,
    EnviosMasivosModule, FranquiciasModule, TesoreriaModule, SecurityModule,
  ],
  providers: [
    { provide: APP_FILTER,      useClass: AllExceptionsFilter },
    { provide: APP_GUARD,       useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditContextInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
