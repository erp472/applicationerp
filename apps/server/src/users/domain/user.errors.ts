export abstract class UserDomainError extends Error {
  abstract readonly statusCode: number;
}

export class UserNotFoundError extends UserDomainError {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`User ${id} not found`);
    this.name = 'UserNotFoundError';
  }
}

export class EmailAlreadyRegisteredError extends UserDomainError {
  readonly statusCode = 409;
  constructor(email: string) {
    super(`Email ${email} is already registered`);
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class BranchNotFoundError extends UserDomainError {
  readonly statusCode = 400;
  constructor(id: string) {
    super(`Branch ${id} not found`);
    this.name = 'BranchNotFoundError';
  }
}
