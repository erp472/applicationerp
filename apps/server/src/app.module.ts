import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuditModule } from './audit/audit.module.js';
import { MetricsModule } from './metrics/metrics.module.js';
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
import { AuditContextInterceptor } from './common/interceptors/audit-context.interceptor.js';

@Module({
  imports: [PrismaModule, AuditModule, MetricsModule, AuthModule, UsersModule, DevicesModule, PermisosModule, FeatureFlagsModule, GeoModule, ComerciosModule, RegionalesModule, SucursalesModule, EquiposModule, ProductosModule, ServiciosModule, CajasModule, VentasModule, ClientesModule, InventarioModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: AuditContextInterceptor },
  ],
})
export class AppModule {}
