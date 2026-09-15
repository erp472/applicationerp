import type { TipoCaja } from '../caja.entity.js';
import { esCajaOperativa } from './asignacion-caja.js';

export interface CajaConfigurada {
  codigo: string;
  tipo: TipoCaja;
  baseDia: string;
  activo: boolean;
}

export type ProblemaPunto =
  | 'sin_caja_fuerte'
  | 'sin_supervisor'
  | 'base_fuerte_excede_punto'
  | 'reparto_excede_fuerte';

export interface DiagnosticoPunto {
  baseGeneral: string;
  baseFuerte: string;
  sumaOperativas: string;
  baseMenor: string;
  sumaRepartida: string;
  disponible: string;
  problemas: ProblemaPunto[];
}

// Las tres cifras están contenidas, no sumadas: la Caja General autoriza al punto un
// techo (base_general), la Caja Fuerte custodia ese mismo dinero, y las cajas del punto
// reparten lo que sale de la Fuerte. El invariante es
//   repartido <= Caja Fuerte <= base del punto
// y hasta ahora solo se verificaban los extremos contra base_general, de modo que un
// punto con base 5.000.000, Fuerte 1.000.000 y 3.200.000 repartidos se reportaba sano.
// Un punto ya incoherente tiene que poder repararse por partes: si se rechaza todo
// guardado mientras exista cualquier problema, bajar la base de la Caja Fuerte queda
// bloqueado por un exceso del reparto que aún no se ha tocado. Solo se rechaza
// lo que el cambio introduce o empeora.
export function regresionesConfiguracion(
  antes: DiagnosticoPunto,
  despues: DiagnosticoPunto,
): ProblemaPunto[] {
  const magnitud: Record<string, (d: DiagnosticoPunto) => number> = {
    base_fuerte_excede_punto: d => Number(d.baseFuerte)    - Number(d.baseGeneral),
    reparto_excede_fuerte:    d => Number(d.sumaRepartida) - Number(d.baseFuerte),
  };

  return despues.problemas.filter(p => {
    if (!antes.problemas.includes(p)) return true;
    const medir = magnitud[p];
    return medir ? medir(despues) > medir(antes) : false;
  });
}

export function diagnosticarPunto(
  baseGeneral: string,
  supervisorId: number | null,
  cajas: CajaConfigurada[],
): DiagnosticoPunto {
  const activas = cajas.filter(c => c.activo);
  const fuerte  = activas.find(c => c.tipo === 'general');
  const sumar   = (cs: CajaConfigurada[]) => cs.reduce((acc, c) => acc + Number(c.baseDia), 0);

  const sumaOperativas = sumar(activas.filter(c => esCajaOperativa(c.tipo)));
  const baseMenor      = sumar(activas.filter(c => c.tipo === 'menor'));
  const sumaRepartida  = sumaOperativas + baseMenor;
  const baseFuerte     = Number(fuerte?.baseDia ?? '0');

  const problemas: ProblemaPunto[] = [];
  if (!fuerte)               problemas.push('sin_caja_fuerte');
  if (supervisorId === null) problemas.push('sin_supervisor');
  if (fuerte && baseFuerte > Number(baseGeneral)) {
    problemas.push('base_fuerte_excede_punto');
  }
  if (fuerte && sumaRepartida > baseFuerte) {
    problemas.push('reparto_excede_fuerte');
  }

  return {
    baseGeneral,
    baseFuerte:     fuerte?.baseDia ?? '0',
    sumaOperativas: sumaOperativas.toFixed(2),
    baseMenor:      baseMenor.toFixed(2),
    sumaRepartida:  sumaRepartida.toFixed(2),
    disponible:     Math.max(0, baseFuerte - sumaRepartida).toFixed(2),
    problemas,
  };
}
