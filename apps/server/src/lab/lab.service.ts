import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { compare, hash } from '@node-rs/bcrypt';
import { randomUUID } from 'node:crypto';
import { LabUserMongo, type LabUserDoc } from './lab-user.schema.js';
import { LabSessionMongo, type LabSessionDoc } from './lab-session.schema.js';

export interface LabLoginResult {
  token:   string;
  usuario: string;
  rol:     string;
}

@Injectable()
export class LabService {
  private readonly logger = new Logger(LabService.name);

  constructor(
    @InjectModel(LabUserMongo.name)    private readonly userModel: Model<LabUserDoc>,
    @InjectModel(LabSessionMongo.name) private readonly sessionModel: Model<LabSessionDoc>,
  ) {}

  async login(usuario: string, contraseña: string): Promise<LabLoginResult> {
    const user = await this.userModel.findOne({ usuario: usuario.toLowerCase().trim(), activo: true }).lean();
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await compare(contraseña, user.contraseña_hash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const token     = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.sessionModel.create({ token, usuario: user.usuario, rol: user.rol, expiresAt });

    return { token, usuario: user.usuario, rol: user.rol };
  }

  async verify(token: string): Promise<{ usuario: string; rol: string }> {
    if (!token) throw new UnauthorizedException('Token requerido');
    const session = await this.sessionModel
      .findOne({ token, expiresAt: { $gt: new Date() } })
      .lean();
    if (!session) throw new UnauthorizedException('Sesión inválida o expirada');
    return { usuario: session.usuario, rol: session.rol };
  }

  async logout(token: string): Promise<void> {
    if (token) await this.sessionModel.deleteOne({ token });
  }

  /** Crea un usuario Lab (usado en scripts de seed). */
  async createUser(usuario: string, contraseña: string, rol = 'dev'): Promise<void> {
    const contraseña_hash = await hash(contraseña, 10);
    await this.userModel.updateOne(
      { usuario: usuario.toLowerCase().trim() },
      { $set: { contraseña_hash, rol, activo: true } },
      { upsert: true },
    );
    this.logger.log(`Lab user "${usuario}" upserted with rol "${rol}"`);
  }
}
