-- v1.1.0 — Feature flags: segmentación por usuario (A/B testing)
-- Permite activar un flag para usuarios específicos, independientemente del rol.

CREATE TABLE "feature_flag_usuarios" (
    "feature_flags_idfeature_flags" INTEGER NOT NULL,
    "usuarios_idusuarios"           INTEGER NOT NULL,

    CONSTRAINT "feature_flag_usuarios_pkey" PRIMARY KEY ("feature_flags_idfeature_flags","usuarios_idusuarios")
);

ALTER TABLE "feature_flag_usuarios"
  ADD CONSTRAINT "feature_flag_usuarios_feature_flags_fkey"
  FOREIGN KEY ("feature_flags_idfeature_flags")
  REFERENCES "feature_flags"("idfeature_flags")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "feature_flag_usuarios"
  ADD CONSTRAINT "feature_flag_usuarios_usuarios_fkey"
  FOREIGN KEY ("usuarios_idusuarios")
  REFERENCES "usuarios"("idusuarios")
  ON DELETE CASCADE ON UPDATE CASCADE;
