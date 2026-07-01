export abstract class FeatureFlagsDomainError extends Error {
  abstract readonly statusCode: number;
}

export class FeatureFlagNotFoundError extends FeatureFlagsDomainError {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`Feature flag "${id}" no encontrado`);
    this.name = 'FeatureFlagNotFoundError';
  }
}

export class FeatureFlagNombreDuplicadoError extends FeatureFlagsDomainError {
  readonly statusCode = 409;
  constructor(nombre: string) {
    super(`Ya existe un feature flag con el nombre "${nombre}"`);
    this.name = 'FeatureFlagNombreDuplicadoError';
  }
}
