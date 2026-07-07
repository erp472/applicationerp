import type { SucursalEntity } from '../domain/sucursal.entity.js';

export interface SucursalResponse {
  id:              number;
  regionalId:      number;
  codigo:          string;
  nombre:          string;
  tipo:            string;
  direccion:       string | null;
  telefono:        string | null;
  email:           string | null;
  horarioApertura: string | null;
  horarioCierre:   string | null;
  activo:          boolean;
  createdAt:       string;
  updatedAt:       string;
  regional:        { id: number; codigo: string; nombre: string; comercio: { id: number; codigo: string; nombre: string } } | null;
  pais:            { id: number; nombre: string } | null;
  departamento:    { id: number; nombre: string } | null;
  ciudad:          { id: number; nombre: string } | null;
}

function formatTime(d: Date | null): string | null {
  if (!d) return null;
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export class SucursalesPresenter {
  static toResponse(entity: SucursalEntity): SucursalResponse {
    return {
      id:              entity.id,
      regionalId:      entity.regionalId,
      codigo:          entity.codigo,
      nombre:          entity.nombre,
      tipo:            entity.tipo,
      direccion:       entity.direccion,
      telefono:        entity.telefono,
      email:           entity.email,
      horarioApertura: formatTime(entity.horarioApertura),
      horarioCierre:   formatTime(entity.horarioCierre),
      activo:          entity.activo,
      createdAt:       entity.createdAt.toISOString(),
      updatedAt:       entity.updatedAt.toISOString(),
      regional:        entity.regional ?? null,
      pais:            entity.pais         ?? null,
      departamento:    entity.departamento ?? null,
      ciudad:          entity.ciudad       ?? null,
    };
  }

  static toList(entities: SucursalEntity[]): SucursalResponse[] {
    return entities.map((e) => SucursalesPresenter.toResponse(e));
  }
}
