import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LabSessionDoc = HydratedDocument<LabSessionMongo>;

@Schema({ collection: 'lab_sessions' })
export class LabSessionMongo {
  @Prop({ required: true, unique: true, index: true })
  token: string;

  @Prop({ required: true })
  usuario: string;

  @Prop({ required: true })
  rol: string;

  /** MongoDB TTL index — elimina el documento automáticamente al expirar. */
  @Prop({ default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) })
  expiresAt: Date;
}

export const LabSessionSchema = SchemaFactory.createForClass(LabSessionMongo);
LabSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
