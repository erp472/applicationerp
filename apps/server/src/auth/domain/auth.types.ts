export interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
  sucursal_id: string | null;
  nombre: string;
  permisos: string[];
}

export interface LoginResult {
  access_token: string;
  usuario: {
    id: string;
    nombre: string;
    rol: string;
    sucursal_id: string | null;
    permisos: string[];
  };
}
