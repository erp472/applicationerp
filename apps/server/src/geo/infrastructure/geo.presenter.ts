import type { PaisEntity, DepartamentoEntity, CiudadEntity } from '../domain/geo.entity.js';

export class GeoPresenter {
  static pais(e: PaisEntity)             { return { id: e.id, nombre: e.nombre }; }
  static departamento(e: DepartamentoEntity) { return { id: e.id, paisId: e.paisId, nombre: e.nombre }; }
  static ciudad(e: CiudadEntity)         { return { id: e.id, departamentoId: e.departamentoId, nombre: e.nombre }; }

  static paisesList(list: PaisEntity[])             { return list.map(GeoPresenter.pais); }
  static departamentosList(list: DepartamentoEntity[]) { return list.map(GeoPresenter.departamento); }
  static ciudadesList(list: CiudadEntity[])         { return list.map(GeoPresenter.ciudad); }
}
