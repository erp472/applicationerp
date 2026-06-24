const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface LoginResult {
  access_token: string;
  usuario: {
    id: string;
    nombre: string;
    rol: string;
    sucursal_id: string | null;
  };
}

export async function login(
  email: string,
  password: string,
  mac: string | null,
): Promise<LoginResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (mac) headers['x-mac-address'] = mac;

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `Error ${res.status}`);
  }

  return res.json() as Promise<LoginResult>;
}
