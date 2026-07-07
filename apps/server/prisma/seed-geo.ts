import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { PrismaClient } from '../generated/prisma/client.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const JSON_DIR = join(__dirname, '..', '..', '..', 'docs', 'countries-master', 'json')

interface CountryJson { id: number; name: string }
interface StateJson   { id: number; id_country: number; name: string }
interface CityJson    { id: number; id_state: number; name: string }

function readJson<T>(file: string): T {
  const raw = readFileSync(join(JSON_DIR, file), 'utf-8')
  const parsed = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw)
  const key = Object.keys(parsed)[0]
  return parsed[key] as T
}

export async function seedGeo(prisma: PrismaClient) {
  console.log('  → Seeding geo data...')

  const countries: CountryJson[] = readJson('countries.json')
  const states: StateJson[]      = readJson('states.json')
  const cities: CityJson[]       = readJson('cities.json')

  // Países — todos
  await prisma.pais.createMany({
    data: countries.map(c => ({ idpaises: c.id, nombrepaises: c.name })),
    skipDuplicates: true,
  })
  console.log(`  ✓ Países: ${countries.length}`)

  // Departamentos — todos
  await prisma.departamento.createMany({
    data: states.map(s => ({
      iddepartamentos:     s.id,
      paises_idpaises:     s.id_country,
      nombredepartamentos: s.name,
    })),
    skipDuplicates: true,
  })
  console.log(`  ✓ Departamentos: ${states.length}`)

  // Ciudades — solo Colombia (id_country = 82)
  const colStates = new Set(states.filter(s => s.id_country === 82).map(s => s.id))
  const colCities = cities.filter(c => colStates.has(c.id_state))

  const BATCH = 500
  for (let i = 0; i < colCities.length; i += BATCH) {
    await prisma.ciudad.createMany({
      data: colCities.slice(i, i + BATCH).map(c => ({
        idciudades:                    c.id,
        departamentos_iddepartamentos: c.id_state,
        nombreciudades:                c.name,
      })),
      skipDuplicates: true,
    })
  }
  console.log(`  ✓ Ciudades Colombia: ${colCities.length}`)
}
