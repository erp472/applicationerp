import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CajasService } from '../../cajas/application/cajas.service.js';
import { RECAUDOS_REPOSITORY } from '../domain/recaudo.repository.js';
import type { IRecaudosRepository } from '../domain/recaudo.repository.js';
import { verificarConvenioActivoSucursal } from '../../ventas/domain/calculos/convenio-activo-sucursal.js';
import { calcularValorRecaudo } from '../../ventas/domain/calculos/valor-recaudo.js';
import { buildImpactoCajaRecaudo } from '../../ventas/domain/calculos/impacto-caja-recaudo.js';
import type { RegistrarRecaudoDto } from '../dto/recaudos.dto.js';

@Injectable()
export class RecaudosService {
  constructor(
    @Inject(RECAUDOS_REPOSITORY)
    private readonly repo: IRecaudosRepository,
    private readonly cajasService: CajasService,
  ) {}

  async getConveniosBySucursal(sucursalId: number) {
    return this.repo.findConveniosBySucursal(sucursalId);
  }

  async registrarRecaudo(cajaId: number, usuarioId: number, dto: RegistrarRecaudoDto) {
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new BadRequestException(`No hay sesión activa para caja ${cajaId}`);

    const estaActivo = await this.repo.isConvenioActivoEnSucursal(dto.convenioId, sesion.sucursalId);
    const conveniosSucursal = [{ convenioId: dto.convenioId, sucursalId: sesion.sucursalId, activo: estaActivo }];
    if (!verificarConvenioActivoSucursal(conveniosSucursal, dto.convenioId, sesion.sucursalId)) {
      throw new BadRequestException(`Convenio ${dto.convenioId} no está activo en esta sucursal`);
    }

    const valorTotal = calcularValorRecaudo(String(dto.monto), String(dto.comisionOperador));

    const recaudo = await this.repo.registrarRecaudo({
      convenioId:     dto.convenioId,
      sucursalId:     sesion.sucursalId,
      sesionCajaId:   sesion.id,
      usuarioId,
      referenciaPago: dto.referenciaPago,
      codigoBarras:   dto.codigoBarras,
      monto:          Number(valorTotal),
    });

    const impacto = buildImpactoCajaRecaudo(valorTotal);
    const { movimiento, saldoActual, alertas } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           impacto.tipoMovimiento as any,
      monto:          impacto.monto,
      medioPago:      'efectivo',
      referenciaId:   recaudo.id,
      referenciaTipo: 'Recaudo',
    });

    return { recaudo, movimiento, saldoActual, alertas };
  }

  async anularRecaudo(id: number) {
    const recaudo = await this.repo.findRecaudoById(id);
    if (!recaudo) throw new NotFoundException(`Recaudo #${id} no encontrado`);
    if (recaudo.estado === 'anulado') throw new BadRequestException('El recaudo ya está anulado');
    return this.repo.anularRecaudo(id);
  }

  async getRecaudo(id: number) {
    const recaudo = await this.repo.findRecaudoById(id);
    if (!recaudo) throw new NotFoundException(`Recaudo #${id} no encontrado`);
    return recaudo;
  }

  async listRecaudosBySesion(sesionId: number) {
    return this.repo.findRecaudosBySesion(sesionId);
  }
}
