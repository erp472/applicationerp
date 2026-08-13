import { Injectable } from '@nestjs/common';
import type { WebSocket } from '@fastify/websocket';

export type RealtimeEvent =
  | 'cajas.status'
  | 'cajas.sesion.abierta'
  | 'cajas.sesion.cerrada'
  | 'cajas.movimiento'
  | 'cajas.consignacion'
  | 'cajas.custodia'
  | 'ventas.venta_confirmada'
  | 'inventario.stock_bajo'
  | 'heartbeat';

export interface RealtimeMessage {
  event: RealtimeEvent;
  data:  unknown;
}

@Injectable()
export class RealtimeService {
  private readonly clients = new Set<WebSocket>();

  addClient(ws: WebSocket): void {
    this.clients.add(ws);
    ws.on('close', () => this.clients.delete(ws));
  }

  broadcast(event: RealtimeEvent, data: unknown = {}): void {
    const msg = JSON.stringify({ event, data });
    for (const ws of this.clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(msg);
      }
    }
  }

  get connectionCount(): number {
    return this.clients.size;
  }
}
