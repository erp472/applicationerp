export abstract class FeatureFlagDomainError extends Error {
  abstract readonly statusCode: number;
}

export class FeatureFlagNotFoundError extends FeatureFlagDomainError {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`FeatureFlag ${id} no encontrado`);
    this.name = 'FeatureFlagNotFoundError';
  }
}

export class FeatureFlagCodigoDuplicadoError extends FeatureFlagDomainError {
  readonly statusCode = 409;
  constructor(codigo: string) {
    super(`FeatureFlag "${codigo}" ya existe`);
    this.name = 'FeatureFlagCodigoDuplicadoError';
  }
}
