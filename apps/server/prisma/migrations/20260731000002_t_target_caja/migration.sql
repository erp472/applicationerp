-- RF-2.01: T_target por caja — nivel óptimo de liquidez configurado por tesorería
-- ΔQ = T_target − B_i(t) cuando B_i(t) ≤ T_min (reposición requerida)

ALTER TABLE "cajas" ADD COLUMN "t_targetcajas" DECIMAL(18,2);
