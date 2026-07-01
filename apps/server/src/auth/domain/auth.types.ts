export interface JwtPayload {
  sub: number;
  email: string;
  rol: string;
  sucursal_id: number | null;
  nombre: string;
}

export interface LoginResult {
  access_token: string;
  usuario: {
    id: number;
    nombre: string;
    rol: string;
    sucursal_id: number | null;
  };
}
