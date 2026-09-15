import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SigmaService {
  private readonly logger = new Logger(SigmaService.name);
  private readonly baseUrl = process.env['SIGMA_URL'] ?? '';

  async getCodigoPostal(ciudad: string): Promise<string | null> {
    if (!this.baseUrl) return null;
    try {
      const res = await fetch(`${this.baseUrl}/postal?ciudad=${encodeURIComponent(ciudad)}`);
      if (!res.ok) return null;
      const data = await res.json() as { codigoPostal?: string };
      return data.codigoPostal ?? null;
    } catch {
      this.logger.warn(`SIGMA código postal no disponible para ciudad: ${ciudad}`);
      return null;
    }
  }

  async registrarEnvio(envio: Record<string, unknown>): Promise<void> {
    if (!this.baseUrl) return;
    await fetch(`${this.baseUrl}/envios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envio),
    });
  }

  async notificarAnulacion(ventaId: number): Promise<void> {
    if (!this.baseUrl) return;
    await fetch(`${this.baseUrl}/anulaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ventaId }),
    });
  }
}
