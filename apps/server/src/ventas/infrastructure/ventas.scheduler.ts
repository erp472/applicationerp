import { Injectable, Logger } from '@nestjs/common';
import { Cron }              from '@nestjs/schedule';
import { PrismaService }     from '../../prisma/prisma.service.js';

@Injectable()
export class VentasScheduler {
  private readonly logger = new Logger(VentasScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 01:00 — Transiciones diarias de apartados postales:
   *  1. ocupado  → vencido   cuando fecha_fin < hoy
   *  2. vencido  → disponible cuando fecha_fin < (hoy - 30 días)
   *     y limpia la asociación de cliente
   */
  @Cron('0 1 * * *')
  async gestionarCicloApartados() {
    const hoy       = new Date();
    hoy.setHours(0, 0, 0, 0);

    const haceTreintaDias = new Date(hoy);
    haceTreintaDias.setDate(haceTreintaDias.getDate() - 30);

    // 1. ocupado → vencido
    const { count: vencidos } = await this.prisma.apartadoPostal.updateMany({
      where: {
        estadoapartados_postales: 'ocupado',
        fecha_finapartados_postales: { lt: hoy },
        deleted_atapartados_postales: null,
      },
      data: { estadoapartados_postales: 'vencido' },
    });

    // 2. vencido → disponible (vencimiento > 30 días, cliente no renovó)
    const { count: liberados } = await this.prisma.apartadoPostal.updateMany({
      where: {
        estadoapartados_postales: 'vencido',
        fecha_finapartados_postales: { lt: haceTreintaDias },
        deleted_atapartados_postales: null,
      },
      data: {
        estadoapartados_postales:   'disponible',
        clientes_idclientes:        null,
        ventas_idventas:            null,
        fecha_inicioapartados_postales: null,
        fecha_finapartados_postales:    null,
        valorapartados_postales:        null,
      },
    });

    if (vencidos > 0 || liberados > 0) {
      this.logger.log(
        `Ciclo apartados — vencidos: ${vencidos}, liberados para reventa: ${liberados}`,
      );
    }
  }
}
