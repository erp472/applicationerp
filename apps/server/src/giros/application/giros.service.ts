import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CajasService } from '../../cajas/application/cajas.service.js';
import { GIROS_REPOSITORY } from '../domain/giro.repository.js';
import type { IGirosRepository } from '../domain/giro.repository.js';
import { calcularFleteGiroNacional } from '../../ventas/domain/calculos/flete-giro-nacional.js';
import { calcularTotalGiroNacional } from '../../ventas/domain/calculos/total-giro-nacional.js';
import { verificarGiroIncluyeFlete } from '../../ventas/domain/calculos/giro-incluye-flete.js';
import { generarPinGiroNacional } from '../../ventas/domain/calculos/pin-giro-nacional.js';
import { validarListaRestrictiva } from '../../ventas/domain/calculos/validacion-lista-restrictiva.js';
import { calcularConversionGiroInternacional } from '../../ventas/domain/calculos/conversion-giro-internacional.js';
import { calcularComisionGiroInternacional } from '../../ventas/domain/calculos/comision-giro-internacional.js';
import { calcularTotalGiroInternacional } from '../../ventas/domain/calculos/total-giro-internacional.js';
import { validarPinGiroInternacional } from '../../ventas/domain/calculos/pin-giro-internacional.js';
import { buildImpactoCajaGiroEmision } from '../../ventas/domain/calculos/impacto-caja-giro-emision.js';
import { buildImpactoCajaGiroPago } from '../../ventas/domain/calculos/impacto-caja-giro-pago.js';
import type { EmitirGiroNacionalDto } from '../dto/giros.dto.js';
import type { PagarGiroNacionalDto } from '../dto/giros.dto.js';
import type { EmitirGiroInternacionalDto } from '../dto/giros.dto.js';
import type { PagarGiroInternacionalDto } from '../dto/giros.dto.js';

@Injectable()
export class GirosService {
  constructor(
    @Inject(GIROS_REPOSITORY)
    private readonly repo: IGirosRepository,
    private readonly cajasService: CajasService,
  ) {}

  async emitirGiroNacional(cajaId: number, usuarioId: number, dto: EmitirGiroNacionalDto) {
    await this.cajasService.assertServicioActivoEnCaja(cajaId, 'giro_nacional_emision');
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new BadRequestException(`No hay sesión activa en la caja ${cajaId}`);

    const tablaFletes = await this.repo.findTablasFletes('nacional');
    const flete = calcularFleteGiroNacional(String(dto.montoCop), tablaFletes);

    const incluyeFlete = verificarGiroIncluyeFlete('4-72', [{ operador: '4-72', incluyeFlete: true }]);
    const { total } = calcularTotalGiroNacional(String(dto.montoCop), flete, incluyeFlete);

    const pin = generarPinGiroNacional(await this.repo.findPinsExistentes());

    const alertas = validarListaRestrictiva(
      dto.beneficiario.numeroDoc,
      [],
      'automatico',
    );

    const giro = await this.repo.crearGiroNacional({
      sucursalId:             sesion.sucursalId,
      sesionCajaId:           sesion.id,
      usuarioId,
      remitenteTipoDoc:       dto.remitente?.tipoDoc,
      remitenteNumeroDoc:     dto.remitente?.numeroDoc,
      remitenteNombre:        dto.remitente?.nombre,
      remitenteFechaExpDoc:   dto.remitente?.fechaExpDoc ? new Date(dto.remitente.fechaExpDoc) : undefined,
      remitenteCiudad:        dto.remitente?.ciudad,
      remitenteDireccion:     dto.remitente?.direccion,
      remitenteEmail:         dto.remitente?.email,
      remitenteHuella:        dto.remitente?.huella,
      beneficiarioTipoDoc:    dto.beneficiario.tipoDoc,
      beneficiarioNumeroDoc:  dto.beneficiario.numeroDoc,
      beneficiarioNombre:     dto.beneficiario.nombre,
      beneficiarioCiudad:     dto.beneficiario.ciudad,
      beneficiarioDireccion:  dto.beneficiario.direccion,
      beneficiarioTelefono:   dto.beneficiario.telefono,
      beneficiarioMensaje:    dto.beneficiario.mensaje,
      beneficiarioHuella:     dto.beneficiario.huella,
      beneficiarioPep:        dto.beneficiario.pep,
      montoCop:               String(dto.montoCop),
      fleteCop:               flete,
      fleteAsumidoPor:        incluyeFlete ? 'beneficiario' : undefined,
      montoTotalCop:          total,
      pin,
    });

    const impacto = buildImpactoCajaGiroEmision(total);
    const { movimiento, saldoActual } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           impacto.tipoMovimiento as Parameters<typeof this.cajasService.registrarMovimientoVenta>[0]['tipo'],
      monto:          impacto.monto,
      referenciaId:   giro.id,
      referenciaTipo: 'giro',
    });

    return { giro, movimiento, saldoActual, alertas, pin };
  }

  async pagarGiroNacional(cajaId: number, usuarioId: number, dto: PagarGiroNacionalDto) {
    await this.cajasService.assertServicioActivoEnCaja(cajaId, 'giro_nacional_pago');
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new BadRequestException(`No hay sesión activa en la caja ${cajaId}`);

    const giros = await this.repo.findGirosByPinYSucursal(dto.pin);
    const giro = giros.find((g) => g.estado === 'pendiente' && g.tipo === 'nacional');
    if (!giro) throw new NotFoundException(`No se encontró giro nacional pendiente con PIN ${dto.pin}`);

    const giroPagado = await this.repo.pagarGiro(giro.id);

    const impacto = buildImpactoCajaGiroPago(String(giro.montoTotalCop));
    const { movimiento, saldoActual } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           impacto.tipoMovimiento as Parameters<typeof this.cajasService.registrarMovimientoVenta>[0]['tipo'],
      monto:          impacto.monto,
      referenciaId:   giroPagado.id,
      referenciaTipo: 'giro',
    });

    return { giro: giroPagado, movimiento, saldoActual };
  }

  async emitirGiroInternacional(cajaId: number, usuarioId: number, dto: EmitirGiroInternacionalDto) {
    await this.cajasService.assertServicioActivoEnCaja(cajaId, 'giro_internacional_emision');
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new BadRequestException(`No hay sesión activa en la caja ${cajaId}`);

    if (dto.trmDia <= 0) throw new BadRequestException('La TRM debe ser mayor a cero');

    const conversion = calcularConversionGiroInternacional(String(dto.montoCop), String(dto.trmDia));
    const comision = calcularComisionGiroInternacional(
      String(dto.montoCop),
      { tipo: 'porcentual', valor: '3' },
      dto.operador ?? 'moneygram',
    );
    const totales = calcularTotalGiroInternacional(String(dto.montoCop), comision, String(dto.trmDia));

    const tipo = (dto.operador ?? 'moneygram') as 'moneygram' | 'ria' | 'ifs';

    const giro = await this.repo.crearGiroInternacional({
      sucursalId:             sesion.sucursalId,
      sesionCajaId:           sesion.id,
      usuarioId,
      tipo,
      remitenteTipoDoc:       dto.remitente?.tipoDoc,
      remitenteNumeroDoc:     dto.remitente?.numeroDoc,
      remitenteNombre:        dto.remitente?.nombre,
      remitenteCiudad:        dto.remitente?.ciudad,
      remitenteEmail:         dto.remitente?.email,
      remitenteHuella:        dto.remitente?.huella,
      beneficiarioTipoDoc:    dto.beneficiario.tipoDoc,
      beneficiarioNumeroDoc:  dto.beneficiario.numeroDoc,
      beneficiarioNombre:     dto.beneficiario.nombre,
      beneficiarioFechaNac:   dto.beneficiario.fechaNac ? new Date(dto.beneficiario.fechaNac) : undefined,
      beneficiarioPais:       dto.beneficiario.pais,
      beneficiarioEstado:     dto.beneficiario.estado,
      beneficiarioCiudad:     dto.beneficiario.ciudad,
      beneficiarioDireccion:  dto.beneficiario.direccion,
      beneficiarioTelefono:   dto.beneficiario.telefono,
      beneficiarioHuella:     dto.beneficiario.huella,
      beneficiarioPep:        dto.beneficiario.pep,
      beneficiarioSospechoso: dto.beneficiario.sospechoso,
      montoCop:               String(dto.montoCop),
      montoTotalCop:          totales.totalCop,
      montoDestino:           conversion.valorMonedaDestino,
      monedaDestino:          dto.monedaDestino ?? 'USD',
      tasaCambio:             String(dto.trmDia),
      pin:                    dto.pin,
      numeroReferencia:       dto.numeroReferencia,
    });

    const impacto = buildImpactoCajaGiroEmision(totales.totalCop);
    const { movimiento, saldoActual } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           impacto.tipoMovimiento as Parameters<typeof this.cajasService.registrarMovimientoVenta>[0]['tipo'],
      monto:          impacto.monto,
      referenciaId:   giro.id,
      referenciaTipo: 'giro',
    });

    return { giro, movimiento, saldoActual };
  }

  async pagarGiroInternacional(cajaId: number, usuarioId: number, dto: PagarGiroInternacionalDto) {
    await this.cajasService.assertServicioActivoEnCaja(cajaId, 'giro_internacional_pago');
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new BadRequestException(`No hay sesión activa en la caja ${cajaId}`);

    const giros = await this.repo.findGirosByPinYSucursal(dto.pin);
    const giro = giros.find((g) => g.estado === 'pendiente' && g.tipo !== 'nacional');
    if (!giro) throw new NotFoundException(`No se encontró giro internacional pendiente con PIN ${dto.pin}`);

    validarPinGiroInternacional(
      dto.pin,
      giro.tipo,
      dto.nombreBeneficiario,
      dto.numeroDocBeneficiario,
      dto.fechaNacBeneficiario,
      {
        pin:                 giro.pin ?? '',
        nombreBeneficiario:  giro.beneficiarioNombre ?? '',
        cedulaBeneficiario:  giro.beneficiarioNumeroDoc ?? '',
        fechaNacimiento:     giro.beneficiarioFechaNac?.toISOString().slice(0, 10) ?? '',
      },
    );

    const giroPagado = await this.repo.pagarGiro(giro.id);

    const impacto = buildImpactoCajaGiroPago(String(giro.montoTotalCop));
    const { movimiento, saldoActual } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           impacto.tipoMovimiento as Parameters<typeof this.cajasService.registrarMovimientoVenta>[0]['tipo'],
      monto:          impacto.monto,
      referenciaId:   giroPagado.id,
      referenciaTipo: 'giro',
    });

    return { giro: giroPagado, movimiento, saldoActual };
  }

  async anularGiro(giroId: number) {
    const giro = await this.repo.findGiroById(giroId);
    if (!giro) throw new NotFoundException(`Giro ${giroId} no encontrado`);
    if (giro.sesionCajaId) {
      await this.cajasService.assertServicioActivoEnSesion(giro.sesionCajaId, 'giro_nacional_anulacion');
    }
    return this.repo.anularGiro(giroId);
  }

  async getGiro(id: number) {
    const giro = await this.repo.findGiroById(id);
    if (!giro) throw new NotFoundException(`Giro ${id} no encontrado`);
    return giro;
  }

  async listGirosBySesion(sesionId: number) {
    return this.repo.findGirosBySesion(sesionId);
  }
}
