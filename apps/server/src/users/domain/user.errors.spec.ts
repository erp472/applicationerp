import { describe, it, expect } from 'vitest';
import {
  UserNotFoundError,
  EmailAlreadyRegisteredError,
  BranchNotFoundError,
} from './user.errors.js';

describe('User domain errors', () => {
  it('UserNotFoundError incluye id y statusCode 404', () => {
    const e = new UserNotFoundError('abc-123');
    expect(e).toBeInstanceOf(Error);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('abc-123');
    expect(e.name).toBe('UserNotFoundError');
  });

  it('EmailAlreadyRegisteredError incluye email y statusCode 409', () => {
    const e = new EmailAlreadyRegisteredError('cajero@4-72.co');
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('cajero@4-72.co');
    expect(e.name).toBe('EmailAlreadyRegisteredError');
  });

  it('BranchNotFoundError incluye id y statusCode 400', () => {
    const e = new BranchNotFoundError('sucursal-5');
    expect(e.statusCode).toBe(400);
    expect(e.message).toContain('sucursal-5');
    expect(e.name).toBe('BranchNotFoundError');
  });
});
