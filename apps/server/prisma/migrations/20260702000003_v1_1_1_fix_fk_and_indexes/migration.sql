-- Migration v1.1.1 — Fix FK names on feature_flag_usuarios + partial index on giros

-- ── 1. FK names (drift detected by prisma migrate diff) ──────────────────────
ALTER TABLE "feature_flag_usuarios"
  RENAME CONSTRAINT "feature_flag_usuarios_feature_flags_fkey"
  TO "feature_flag_usuarios_feature_flags_idfeature_flags_fkey";

ALTER TABLE "feature_flag_usuarios"
  RENAME CONSTRAINT "feature_flag_usuarios_usuarios_fkey"
  TO "feature_flag_usuarios_usuarios_idusuarios_fkey";

-- ── 2. Partial index on giros.pingiros (replace full index) ──────────────────
DROP INDEX IF EXISTS "idx_giros_pin";
CREATE INDEX "idx_giros_pin" ON "giros"("pingiros") WHERE pingiros IS NOT NULL;
