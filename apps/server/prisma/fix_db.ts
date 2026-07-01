import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const stmts = [
  `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "descripcion" VARCHAR(200)`,
  `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "activo" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
  `
    CREATE TABLE IF NOT EXISTS "modulos" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "nombre" VARCHAR(80) NOT NULL,
      "descripcion" VARCHAR(200),
      "orden" INTEGER NOT NULL DEFAULT 0,
      "activo" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "modulos_pkey" PRIMARY KEY ("id")
    )
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS "modulos_nombre_key" ON "modulos"("nombre")`,
  `
    CREATE TABLE IF NOT EXISTS "permisos" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "nombre" VARCHAR(80) NOT NULL,
      "descripcion" VARCHAR(200),
      "moduloId" UUID NOT NULL,
      "activo" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
    )
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS "permisos_moduloId_nombre_key" ON "permisos"("moduloId", "nombre")`,
  `CREATE INDEX IF NOT EXISTS "permisos_moduloId_idx" ON "permisos"("moduloId")`,
  `
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permisos_moduloId_fkey') THEN
        ALTER TABLE "permisos" ADD CONSTRAINT "permisos_moduloId_fkey"
          FOREIGN KEY ("moduloId") REFERENCES "modulos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `,
  `
    CREATE TABLE IF NOT EXISTS "roles_permisos" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "rolId" UUID NOT NULL,
      "permisoId" UUID NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("id")
    )
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS "roles_permisos_rolId_permisoId_key" ON "roles_permisos"("rolId", "permisoId")`,
  `CREATE INDEX IF NOT EXISTS "roles_permisos_rolId_idx" ON "roles_permisos"("rolId")`,
  `
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_permisos_rolId_fkey') THEN
        ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_rolId_fkey"
          FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `,
  `
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_permisos_permisoId_fkey') THEN
        ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permisoId_fkey"
          FOREIGN KEY ("permisoId") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `,
]

async function main() {
  for (const sql of stmts) {
    await prisma.$executeRawUnsafe(sql.trim())
    console.log('✓', sql.trim().split('\n')[0].slice(0, 60))
  }
  console.log('\nDone!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
