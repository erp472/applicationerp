import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { AlertSeverity, MitreTechnique, NistCsfControl } from './security-alert.types.js';

export type SecurityAlertDoc = HydratedDocument<SecurityAlertMongo>;

@Schema({
  collection: 'security_alerts',
  timestamps: { createdAt: 'timestamp', updatedAt: false },
})
export class SecurityAlertMongo {
  @Prop({ type: String, required: true })
  id!: string;

  @Prop({ type: String, required: true })
  mitre!: MitreTechnique;

  @Prop({ type: String, required: true })
  nist_csf!: NistCsfControl;

  @Prop({ type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  severidad!: AlertSeverity;

  @Prop({ type: String, required: true })
  descripcion!: string;

  @Prop({ type: String })
  ip?: string;

  @Prop({ type: Number })
  usuario_id?: number;

  @Prop({ type: String })
  audit_key?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  /** Populated by timestamps option */
  timestamp!: Date;
}

export const SecurityAlertSchema = SchemaFactory.createForClass(SecurityAlertMongo);

SecurityAlertSchema.index({ severidad: 1, timestamp: -1 });
SecurityAlertSchema.index({ mitre: 1, timestamp: -1 });
SecurityAlertSchema.index({ usuario_id: 1, timestamp: -1 });
SecurityAlertSchema.index({ ip: 1, timestamp: -1 });
