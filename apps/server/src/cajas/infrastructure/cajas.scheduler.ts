import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CajasService } from '../application/cajas.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';

@Injectable()
export class CajasScheduler {
  private readonly logger = new Logger(CajasScheduler.name);

  constructor(
    private readonly cajasService: CajasService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Cron('0 22 * * *')
  async cierreAutomatico() {
    const inicio = Date.now();
    this.logger.log('Cron cierre automático 22:00 — iniciando');

    const systemUser = await this.prisma.usuario.findFirst({
      where: { rol: { codigoroles: 'ADMIN_SISTEMA' }, activousuarios: true },
      select: { idusuarios: true },
    });

    if (!systemUser) {
      this.logger.warn('Cron cierre automático: no se encontró usuario ADMIN_SISTEMA activo');
      void this.audit.log({
        audit_key:     'ADM-09',
        accion:        'CREATE',
        entidad:       'job_cierre_automatico',
        entidad_id:    0,
        resultado:     'ERROR',
        error_msg:     'No se encontró usuario ADMIN_SISTEMA activo',
        datos_despues: {
          tipo_evento:         'job_cierre_automatico',
          puntos_procesados:   0,
          sesiones_cerradas:   0,
          sesiones_con_error:  0,
          duracion_ms:         Date.now() - inicio,
        },
      });
      return;
    }

    const padres = await this.cajasService.listCajaPadres();
    let cerradas = 0;
    let errores = 0;
    const puntosConError: number[] = [];

    for (const padre of padres) {
      try {
        const resultado = await this.cajasService.resetAutomaticoPunto(padre.id, systemUser.idusuarios);
        cerradas += resultado.auxiliaresCerradas;
        if (resultado.auxiliaresCerradas > 0) {
          this.logger.log(`Punto ${padre.id}: ${resultado.auxiliaresCerradas} sesiones cerradas forzosamente`);
        }
      } catch (err) {
        errores++;
        puntosConError.push(padre.id);
        this.logger.error(`Punto ${padre.id}: error en cierre automático`, err);
      }
    }

    const duracion_ms = Date.now() - inicio;
    this.logger.log(`Cron cierre automático finalizado — total sesiones cerradas: ${cerradas}`);

    void this.audit.log({
      audit_key:     'ADM-09',
      usuario_id:    systemUser.idusuarios,
      accion:        'CREATE',
      entidad:       'job_cierre_automatico',
      entidad_id:    0,
      resultado:     errores > 0 ? 'ERROR' : 'OK',
      datos_despues: {
        tipo_evento:         'job_cierre_automatico',
        puntos_procesados:   padres.length,
        sesiones_cerradas:   cerradas,
        sesiones_con_error:  errores,
        puntos_con_error:    puntosConError,
        duracion_ms,
      },
    });
  }
}
