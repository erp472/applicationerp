import { createHash } from 'crypto';

const ORDEN_CAMPOS = [
  'NumFac', 'FecFac', 'HorFac', 'ValFac',
  'CodImp1', 'ValImp1', 'CodImp2', 'ValImp2', 'CodImp3', 'ValImp3',
  'ValTot', 'NitOFE', 'NumAdq',
];

export function generarCufeElectronica(
  camposCufe: Record<string, string>,
  claveTecnica: string,
): string {
  const cadena = ORDEN_CAMPOS.map((c) => camposCufe[c] ?? '').join('') + claveTecnica;
  return createHash('sha384').update(cadena, 'utf8').digest('hex');
}
