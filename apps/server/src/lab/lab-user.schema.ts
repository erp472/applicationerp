import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LabUserDoc = HydratedDocument<LabUserMongo>;

@Schema({ collection: 'lab_users', timestamps: true })
export class LabUserMongo {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  usuario: string;

  @Prop({ required: true })
  contraseña_hash: string;

  @Prop({ default: 'viewer', enum: ['viewer', 'dev', 'admin'] })
  rol: string;

  @Prop({ default: true })
  activo: boolean;
}

export const LabUserSchema = SchemaFactory.createForClass(LabUserMongo);
