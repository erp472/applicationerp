ALTER TABLE "cajas_padres"
  ADD COLUMN "usuarios_idusuarios_supervisor" INTEGER
  REFERENCES "usuarios"("idusuarios");
