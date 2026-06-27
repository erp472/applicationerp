import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../domain/auth.types.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev_secret_change_in_prod',
    });
  }

  validate(payload: JwtPayload) {
    return {
      id:          payload.sub,
      email:       payload.email,
      rol:         Buffer.from(payload.rol, 'base64').toString('utf8'),
      sucursal_id: payload.sucursal_id,
      nombre:      payload.nombre,
      permisos:    payload.permisos ?? [],
    };
  }
}
