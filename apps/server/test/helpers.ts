import request from 'supertest';
import { randomBytes } from 'node:crypto';

export const BASE_URL = 'http://localhost:3000';
export const api = request(BASE_URL);

export const CREDS = {
  admin_sistema:  { email: 'admin@4-72.com.co',            password: 'Admin472!' },
  admin_nacional: { email: 'admin.nacional@4-72.com.co',   password: 'AdminNac472!' },
  supervisor:     { email: 'cajero.principal@4-72.com.co', password: 'Cajero.Principal472' },
  cajero:         { email: 'vendedor@4-72.com.co',         password: 'Vendedor.472' },
  tesoreria:      { email: 'tesoreria@4-72.com.co',        password: 'Tesoreria472!' },
  inventarios:    { email: 'inventarios@4-72.com.co',      password: 'Inventarios472!' },
} as const;

export const SEED = {
  comercio_id:         1,
  regional_id:         1,
  sucursal_id:         56,
  caja_sucursal_id:    1,
  caja_padre_id:       1,
  equipos_sucursal_id: 56,
  tipo_cliente_id:     1,
  pais_id:             82,
} as const;

export type Role = keyof typeof CREDS;

export function unique(prefix: string): string {
  return `${prefix}_${randomBytes(4).toString('hex')}`;
}

export function auth(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

const tokenCache = new Map<Role, string>();

export async function login(role: Role): Promise<string> {
  if (tokenCache.has(role)) return tokenCache.get(role)!;
  const r = await api.post('/auth/login').send(CREDS[role]);
  if (r.status !== 201) throw new Error(`Login failed for ${role}: ${r.text}`);
  tokenCache.set(role, r.body.access_token);
  return r.body.access_token;
}

export function extractList(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (Array.isArray(b['datos'])) return b['datos'];
    if (Array.isArray(b['items'])) return b['items'];
  }
  return [];
}
