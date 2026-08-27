import type { GuiaData, SucursalGuiaInfo } from '../../ventas/domain/guia-svg.generator.js';
import { renderGuiaSvg }                  from '../../ventas/domain/guia-svg.generator.js';
import { svgsToPdf }                      from '../../common/svg-to-pdf.js';

export interface GuiaPdfItem {
  loteId:            number;
  fila:              number;
  numeroGuia:        string;
  codigoTracking:    string | null;
  remitente: {
    nombre:    string;
    documento: string | null;
    direccion: string | null;
    ciudad:    string | null;
    telefono:  string | null;
    cp:        string | null;
  };
  destinatario: {
    nombre:    string;
    documento: string | null;
    direccion: string | null;
    ciudad:    string | null;
    pais:      string;
    telefono:  string | null;
    cp:        string | null;
  };
  servicio:           string;
  pesoFisicoKg:       number;
  pesoTarificadoKg:   number;
  valorServicio:      number;
  valorCertificacion: number;
  valorTotal:         number;
  contenido:          string | null;
  observaciones:      string | null;
  fecha:              Date;
}

// ── Formateadores ─────────────────────────────────────────────────────────────

const copFmt = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
});
const numFmt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 });

function fmtDate(d: Date): string {
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtCop(v: number): string {
  return copFmt.format(v).replace(/\$\s?/, '');
}
function fmtKg(v: number): string {
  return numFmt.format(v);
}

// ── Mapper GuiaPdfItem → GuiaData ─────────────────────────────────────────────

function buildGuiaDataFromItem(item: GuiaPdfItem, sucursal: SucursalGuiaInfo): GuiaData {
  const admision = fmtDate(item.fecha);
  const guia     = item.numeroGuia;
  const tracking = item.codigoTracking ?? guia;

  return {
    centroOperativo:    sucursal.nombre,
    fechaAdmision:      admision,
    fechaApproxEntrega: '',

    remitenteNombre:    item.remitente.nombre,
    remitenteDireccion: item.remitente.direccion    ?? '',
    remitenteNit:       item.remitente.documento    ?? '',
    remitenteCiudad:    item.remitente.ciudad       ?? '',
    remitenteDepto:     '',
    remitenteTelefono:  item.remitente.telefono     ?? '',
    remitenteCP:        item.remitente.cp           ?? '',

    destinatarioNombre:    item.destinatario.nombre,
    destinatarioDireccion: item.destinatario.direccion ?? '',
    destinatarioCiudad:    item.destinatario.ciudad    ?? '',
    destinatarioDepto:     '',
    destinatarioTel:       item.destinatario.telefono  ?? '',

    codigoOperativo: item.servicio,

    pesoFisico:      fmtKg(item.pesoFisicoKg),
    pesoVolumetrico: '',
    pesoFacturado:   fmtKg(item.pesoTarificadoKg),

    valorDeclarado: '',
    valorFlete:     fmtCop(item.valorServicio),
    costoManejo:    fmtCop(item.valorCertificacion),
    valorTotal:     fmtCop(item.valorTotal),

    observaciones: item.observaciones ?? '',
    diceContener:  item.contenido     ?? '',

    barcodeText1:     `*${guia.slice(0, 10)}`,
    barcodeText2:     `${guia.slice(10)}*`,
    fechaEntrega:     '',
    codigoGuia:       guia,
    fechaPlaceholder1: admision,
    fechaPlaceholder2: '',
    codigoOperativoBajo: sucursal.codigo,
    barcodeLineal:       tracking,

    lateral_destinatarioNombre:    item.destinatario.nombre,
    lateral_destinatarioDireccion: item.destinatario.direccion ?? '',
    lateral_destinatarioCiudad:    item.destinatario.ciudad    ?? '',
    lateral_destinatarioDepto:     '',
    lateral_destinatarioCP:        item.destinatario.cp        ?? '',
    lateral_fechaAdmision:         admision,

    lateral_remitenteNombre:    item.remitente.nombre,
    lateral_remitenteDireccion: item.remitente.direccion ?? '',
    lateral_remitenteCiudad:    item.remitente.ciudad    ?? '',
    lateral_remitenteDepto:     '',
    lateral_remitenteCP:        item.remitente.cp        ?? '',
    lateral_envio:              item.servicio,

    pieLegal1: 'Principal: Bogotá D.C. Colombia Diagonal 25 G # 95 A 55 Bogotá / www.4-72.com.co Línea Nacional: 01 8000 111 210 / Tel. contacto: (571) 4722000. Min. Transporte, Lic. de carga 000200 del 20 de mayo de 2011/Min.TIC, Res. Mensajería Expresa 001967 de 9 septiembre del 2011',
    pieLegal2: 'El usuario deja expresa constancia que tuvo conocimiento del contrato que se encuentra publicado en la pagina web, 4-72 tratará sus datos personales para probar la entrega del envío. Para ejercer algún reclamo: servicioalcliente@4-72.com.co Para consultar la Política de',
    pieLegal3: 'Tratamiento: www.4-72.com.co',

    lateral_derecho_centro: sucursal.nombre,
    lateral_derecho_codigo: sucursal.codigo,
  };
}

// ── API pública ───────────────────────────────────────────────────────────────

export async function generarGuiasMasivasPdf(
  items:    GuiaPdfItem[],
  sucursal: SucursalGuiaInfo,
): Promise<Buffer> {
  const svgBuffers = await Promise.all(
    items.map(item => renderGuiaSvg(buildGuiaDataFromItem(item, sucursal))),
  );
  return svgsToPdf(svgBuffers);
}
