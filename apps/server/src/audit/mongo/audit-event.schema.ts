import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditEventDoc = HydratedDocument<AuditEvent>;

@Schema({
  collection: 'audit_events',
  timestamps: { createdAt: 'timestamp', updatedAt: false },
})
export class AuditEvent {
  @Prop({ type: String, required: true })
  audit_key!: string;

  @Prop({ type: String, required: true, enum: ['ADM', 'OPE', 'FIN', 'CBS'] })
  tipo!: string;

  @Prop({ type: String })
  accion?: string;

  @Prop({ type: String })
  entidad?: string;

  @Prop({ type: String })
  entidad_id?: string;

  @Prop({ type: Number })
  usuario_id?: number;

  @Prop({ type: String })
  ip?: string;

  @Prop({ type: Object })
  payload_antes?: unknown;

  @Prop({ type: Object })
  payload_despues?: unknown;

  @Prop({ type: String, enum: ['OK', 'ERROR'] })
  resultado?: string;

  @Prop({ type: String })
  error_msg?: string;

  @Prop({ type: String })
  mitre_technique?: string;

  /** Enlaza con los documentos de `db_changes` que produjo este mismo request. */
  @Prop({ type: String })
  request_id?: string;

  /** Populated by timestamps option */
  timestamp!: Date;
}

export const AuditEventSchema = SchemaFactory.createForClass(AuditEvent);

AuditEventSchema.index({ audit_key: 1, timestamp: -1 });
AuditEventSchema.index({ usuario_id: 1, timestamp: -1 });
AuditEventSchema.index({ ip: 1, timestamp: -1 });
AuditEventSchema.index({ resultado: 1, timestamp: -1 });
AuditEventSchema.index({ request_id: 1 });
