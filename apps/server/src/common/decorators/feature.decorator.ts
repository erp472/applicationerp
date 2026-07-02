import { SetMetadata } from '@nestjs/common';

export const FEATURE_KEY = 'feature_codigo';

/**
 * Kill-switch / mantenimiento de módulo, independiente de rol o permiso.
 * Se evalúa con FeatureFlagGuard (ver common/guards/feature-flag.guard.ts).
 *
 *   @Feature('modulo_facturacion')   → todo el controller/endpoint depende del flag
 *
 * Se puede combinar con @Can({ permiso: '...' }) apilando ambos guards:
 *   @UseGuards(JwtAuthGuard, FeatureFlagGuard, CanGuard)
 *   @Feature('modulo_facturacion')
 *   @Can({ permiso: 'facturacion:crear' })
 */
export const Feature = (codigo: string) => SetMetadata(FEATURE_KEY, codigo);
