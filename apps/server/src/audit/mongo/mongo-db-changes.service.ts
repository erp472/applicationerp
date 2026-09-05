import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DbChange, type DbChangeDoc } from './db-change.schema.js';
import { redact } from './redact.js';

@Injectable()
export class MongoDbChangesService {
  private readonly logger = new Logger(MongoDbChangesService.name);

  constructor(
    @InjectModel(DbChange.name)
    private readonly model: Model<DbChangeDoc>,
  ) {}

  /** Fire-and-forget: un fallo de auditoría nunca debe tumbar la escritura de negocio. */
  log(cambio: Partial<DbChange>): void {
    this.model.create({
      ...cambio,
      datos_antes:   redact(cambio.datos_antes ?? null) as Record<string, unknown> | null,
      datos_despues: redact(cambio.datos_despues ?? null) as Record<string, unknown> | null,
    }).catch((err: unknown) => {
      this.logger.error(
        `MongoDbChangesService.log failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
  }

  /** Cambios de fila provocados por un mismo request de negocio. */
  async findByRequestId(requestId: string): Promise<DbChangeDoc[]> {
    return this.model.find({ request_id: requestId }).sort({ timestamp: 1 }).exec();
  }
}
