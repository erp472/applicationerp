import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DbChangeDoc = HydratedDocument<DbChange>;

/** NIVEL 4 — cambio a nivel de fila detectado por el middleware de Prisma.
 *  Se separa de `audit_events` (NIVEL 1) porque su volumen es mucho mayor y su
 *  unidad es la tabla, no la operación de negocio. Se correlacionan por `request_id`. */
@Schema({
  collection: 'db_changes',
  timestamps: { createdAt: 'timestamp', updatedAt: false },
})
export class DbChange {
  @Prop({ type: String, required: true })
  tabla!: string;

  @Prop({ type: String, required: true, enum: ['INSERT', 'UPDATE', 'DELETE'] })
  operacion!: string;

  @Prop({ type: Number })
  registro_id?: number;

  @Prop({ type: Number })
  usuario_id?: number;

  @Prop({ type: String })
  ip?: string;

  /** Enlaza con el `request_id` del evento de negocio que originó el cambio. */
  @Prop({ type: String })
  request_id?: string;

  @Prop({ type: Object })
  datos_antes?: Record<string, unknown> | null;

  @Prop({ type: Object })
  datos_despues?: Record<string, unknown> | null;

  /** Populated by timestamps option */
  timestamp!: Date;
}

export const DbChangeSchema = SchemaFactory.createForClass(DbChange);

DbChangeSchema.index({ request_id: 1 });
DbChangeSchema.index({ tabla: 1, timestamp: -1 });
DbChangeSchema.index({ usuario_id: 1, timestamp: -1 });
DbChangeSchema.index({ tabla: 1, registro_id: 1, timestamp: -1 });
