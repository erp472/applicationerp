import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CajasService } from '../application/cajas.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class CajasScheduler {
  private readonly logger = new Logger(CajasScheduler.name);

  constructor(
    private readonly cajasService: CajasService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron('0 22 * * *')
  async cierreAutomatico() {
    this.logger.log('Cron cierre automático 22:00 — iniciando');

    const systemUser = await this.prisma.usuario.findFirst({
      where: { rol: { codigoroles: 'ADMIN_SISTEMA' }, activousuarios: true },
      select: { idusuarios: true },
    });

    if (!systemUser) {
      this.logger.warn('Cron cierre automático: no se encontró usuario ADMIN_SISTEMA activo');
      return;
    }

    const padres = await this.cajasService.listCajaPadres();
    let cerradas = 0;

    for (const padre of padres) {
      try {
        const resultado = await this.cajasService.resetAutomaticoPunto(padre.id, systemUser.idusuarios);
        cerradas += resultado.auxiliaresCerradas;
        if (resultado.auxiliaresCerradas > 0) {
          this.logger.log(`Punto ${padre.id}: ${resultado.auxiliaresCerradas} sesiones cerradas forzosamente`);
        }
      } catch (err) {
        this.logger.error(`Punto ${padre.id}: error en cierre automático`, err);
      }
    }

    this.logger.log(`Cron cierre automático finalizado — total sesiones cerradas: ${cerradas}`);
  }
}
