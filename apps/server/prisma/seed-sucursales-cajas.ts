/**
 * Seed: 64 sucursales + 1 caja POS por sucursal
 * Idempotente — usa upsert en cada entidad.
 * Ejecutar desde apps/server/:
 *   DATABASE_URL=... npx tsx prisma/seed-sucursales-cajas.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool    = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter } as never)

type TipoSuc   = 'unipersonal' | 'multipuesto'
type CodigoReg =
  | 'REG-BOG' | 'REG-MED' | 'REG-CAL' | 'REG-BAR' | 'REG-CAR'
  | 'REG-BUC' | 'REG-EJE' | 'REG-SUR' | 'REG-ORI' | 'REG-COS'
  | 'REG-CEN' | 'REG-AMZ' | 'REG-NSA' | 'REG-CHO' | 'REG-INS'

interface SucursalDef {
  codigo:       string
  nombre:       string
  ciudad:       string
  direccion:    string
  telefono:     string
  email:        string
  tipo:         TipoSuc
  regional:     CodigoReg
  baseDia:      string
  limiteAlerta?: string
  deptId?:      number
  cityId?:      number
}

// ── Geo — Colombia id=82 ──────────────────────────────────────────────────────

const GEO_COLOMBIA = 82

const DEPT: Record<string, number> = {
  CUNDINAMARCA: 1726, ANTIOQUIA: 1700, ARAUCA: 1701, ATLANTICO: 1702,
  CAQUETA: 1703, CAUCA: 1704, CESAR: 1705, CHOCO: 1706, CORDOBA: 1707,
  GUAVIARE: 1708, GUAINIA: 1709, HUILA: 1710, GUAJIRA: 1711, META: 1712,
  NARINO: 1713, NSA: 1714, PUTUMAYO: 1715, QUINDIO: 1716, RISARALDA: 1717,
  SAN_ANDRES: 1718, SANTANDER: 1719, SUCRE: 1720, TOLIMA: 1721, VALLE: 1722,
  VAUPES: 1723, VICHADA: 1724, CASANARE: 1725, CALDAS: 1730, MAGDALENA: 1731,
  BOLIVAR: 2202, BOYACA: 2203, AMAZONAS: 1699,
}

const CITY: Record<string, number> = {
  BOGOTA: 452468, SOACHA: 470044, FACATATIVA: 458372, GIRARDOT_CUN: 458739,
  MEDELLIN: 465167, BELLO: 790330, ITAGUI: 790374, ENVIGADO: 790362,
  RIONEGRO_ANT: 790398, APARTADO: 790325, CAUCASIA: 790346,
  CALI: 452952, PALMIRA: 466354, BUENAVENTURA: 452669, TULUA: 470838, BUGA: 452737,
  BARRANQUILLA: 452072, SOLEDAD: 470076,
  CARTAGENA: 790265,
  BUCARAMANGA: 452650, BARRANCABERMEJA: 452044,
  CUCUTA: 455268,
  PEREIRA: 466857, DOSQUEBRADAS: 455574,
  MANIZALES: 788717,
  ARMENIA: 451749,
  IBAGUE: 460029,
  NEIVA: 465879,
  PASTO: 466631,
  POPAYAN: 467245,
  VILLAVICENCIO: 471413,
  VALLEDUPAR: 471041,
  MONTERIA: 465568, LORICA: 463964,
  SINCELEJO: 469987,
  SANTA_MARTA: 788718,
  RIOHACHA: 468314, MAICAO: 464646,
  FLORENCIA: 458455,
  MOCOA: 465418,
  QUIBDO: 468062,
  ARAUCA: 451648,
  YOPAL: 471577,
  SAN_ANDRES: 468686,
  LETICIA: 463764,
  PUERTO_CARRENO: 467627,
  MITU: 465402,
  SAN_JOSE_GUAVIARE: 469018,
  PUERTO_INIRIDA: 467710,
}

// ── Regionales ────────────────────────────────────────────────────────────────

const REGIONALES: Array<{ codigo: CodigoReg; nombre: string }> = [
  { codigo: 'REG-BOG', nombre: 'Regional Bogotá' },
  { codigo: 'REG-MED', nombre: 'Regional Medellín' },
  { codigo: 'REG-CAL', nombre: 'Regional Cali' },
  { codigo: 'REG-BAR', nombre: 'Regional Barranquilla' },
  { codigo: 'REG-CAR', nombre: 'Regional Cartagena' },
  { codigo: 'REG-BUC', nombre: 'Regional Bucaramanga' },
  { codigo: 'REG-EJE', nombre: 'Regional Eje Cafetero' },
  { codigo: 'REG-SUR', nombre: 'Regional Sur' },
  { codigo: 'REG-ORI', nombre: 'Regional Oriente' },
  { codigo: 'REG-COS', nombre: 'Regional Costa Caribe' },
  { codigo: 'REG-CEN', nombre: 'Regional Centro' },
  { codigo: 'REG-AMZ', nombre: 'Regional Amazonia' },
  { codigo: 'REG-NSA', nombre: 'Regional Norte de Santander' },
  { codigo: 'REG-CHO', nombre: 'Regional Chocó' },
  { codigo: 'REG-INS', nombre: 'Regional Insular' },
]

// ── Código sucursal: 4 dígitos, empieza en 1001 ───────────────────────────────

let _suc = 1001
function genCodigo(): string { return String(_suc++) }

// ── 64 sucursales ─────────────────────────────────────────────────────────────

const SUCURSALES: SucursalDef[] = [

  // ── BOGOTÁ D.C. (6) ────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Bogotá Centro',    ciudad: 'Bogotá',
    direccion: 'Carrera 7 # 16-36',         telefono: '6017447000', email: 'bogotacentro@4-72.com.co',
    tipo: 'multipuesto', regional: 'REG-BOG', baseDia: '500000', limiteAlerta: '100000',
    deptId: DEPT.CUNDINAMARCA, cityId: CITY.BOGOTA },

  { codigo: genCodigo(), nombre: 'Bogotá Norte',     ciudad: 'Bogotá',
    direccion: 'Calle 127 # 15-05',         telefono: '6017447001', email: 'bogotanorte@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-BOG', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.CUNDINAMARCA, cityId: CITY.BOGOTA },

  { codigo: genCodigo(), nombre: 'Bogotá Sur',       ciudad: 'Bogotá',
    direccion: 'Calle 55 Sur # 18D-40',     telefono: '6017447002', email: 'bogotasur@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-BOG', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.CUNDINAMARCA, cityId: CITY.BOGOTA },

  { codigo: genCodigo(), nombre: 'Bogotá Kennedy',   ciudad: 'Bogotá',
    direccion: 'Carrera 80 # 38A-49',       telefono: '6017447003', email: 'bogotakennedy@4-72.com.co',
    tipo: 'multipuesto', regional: 'REG-BOG', baseDia: '400000', limiteAlerta: '100000',
    deptId: DEPT.CUNDINAMARCA, cityId: CITY.BOGOTA },

  { codigo: genCodigo(), nombre: 'Bogotá Usaquén',   ciudad: 'Bogotá',
    direccion: 'Calle 119 # 6-21',          telefono: '6017447004', email: 'bogotausaquen@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-BOG', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.CUNDINAMARCA, cityId: CITY.BOGOTA },

  { codigo: genCodigo(), nombre: 'Bogotá Occidente', ciudad: 'Bogotá',
    direccion: 'Avenida Carrera 86 # 43-55', telefono: '6017447005', email: 'bogotaoccidente@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-BOG', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.CUNDINAMARCA, cityId: CITY.BOGOTA },

  // ── ANTIOQUIA (9) ──────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Medellín El Poblado', ciudad: 'Medellín',
    direccion: 'Carrera 43A # 18-17',       telefono: '6044447000', email: 'medellinpoblado@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-MED', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.ANTIOQUIA, cityId: CITY.MEDELLIN },

  { codigo: genCodigo(), nombre: 'Medellín Centro',  ciudad: 'Medellín',
    direccion: 'Calle 52 # 47-42',          telefono: '6044447001', email: 'medellincentro@4-72.com.co',
    tipo: 'multipuesto', regional: 'REG-MED', baseDia: '400000', limiteAlerta: '100000',
    deptId: DEPT.ANTIOQUIA, cityId: CITY.MEDELLIN },

  { codigo: genCodigo(), nombre: 'Medellín Laureles', ciudad: 'Medellín',
    direccion: 'Circular 73 # 39-67',       telefono: '6044447002', email: 'medellinlaureles@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-MED', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.ANTIOQUIA, cityId: CITY.MEDELLIN },

  { codigo: genCodigo(), nombre: 'Bello',            ciudad: 'Bello',
    direccion: 'Carrera 52 # 51-29',        telefono: '6044447010', email: 'bello@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-MED', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.ANTIOQUIA, cityId: CITY.BELLO },

  { codigo: genCodigo(), nombre: 'Itagüí',           ciudad: 'Itagüí',
    direccion: 'Calle 50 # 55-06',          telefono: '6044447011', email: 'itagui@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-MED', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.ANTIOQUIA, cityId: CITY.ITAGUI },

  { codigo: genCodigo(), nombre: 'Rionegro',         ciudad: 'Rionegro',
    direccion: 'Carrera 50 # 48-20',        telefono: '6044447020', email: 'rionegro@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-MED', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.ANTIOQUIA, cityId: CITY.RIONEGRO_ANT },

  { codigo: genCodigo(), nombre: 'Apartadó',         ciudad: 'Apartadó',
    direccion: 'Carrera 100 # 103-50',      telefono: '6044447021', email: 'apartado@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-MED', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.ANTIOQUIA, cityId: CITY.APARTADO },

  { codigo: genCodigo(), nombre: 'Envigado',         ciudad: 'Envigado',
    direccion: 'Calle 37 Sur # 43B-26',     telefono: '6044447022', email: 'envigado@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-MED', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.ANTIOQUIA, cityId: CITY.ENVIGADO },

  { codigo: genCodigo(), nombre: 'Caucasia',         ciudad: 'Caucasia',
    direccion: 'Carrera 12 # 14-23',        telefono: '6047447010', email: 'caucasia@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-MED', baseDia: '150000', limiteAlerta: '40000',
    deptId: DEPT.ANTIOQUIA, cityId: CITY.CAUCASIA },

  // ── VALLE DEL CAUCA (6) ───────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Cali Centro',      ciudad: 'Cali',
    direccion: 'Carrera 8 # 9-68',          telefono: '6026447000', email: 'calicentro@4-72.com.co',
    tipo: 'multipuesto', regional: 'REG-CAL', baseDia: '400000', limiteAlerta: '100000',
    deptId: DEPT.VALLE, cityId: CITY.CALI },

  { codigo: genCodigo(), nombre: 'Cali Norte',       ciudad: 'Cali',
    direccion: 'Avenida 6N # 23N-30',       telefono: '6026447001', email: 'calinorte@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-CAL', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.VALLE, cityId: CITY.CALI },

  { codigo: genCodigo(), nombre: 'Buenaventura',     ciudad: 'Buenaventura',
    direccion: 'Calle 2 # 2-52',            telefono: '6024447000', email: 'buenaventura@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-CAL', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.VALLE, cityId: CITY.BUENAVENTURA },

  { codigo: genCodigo(), nombre: 'Palmira',          ciudad: 'Palmira',
    direccion: 'Carrera 28 # 29-29',        telefono: '6022447000', email: 'palmira@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-CAL', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.VALLE, cityId: CITY.PALMIRA },

  { codigo: genCodigo(), nombre: 'Tuluá',            ciudad: 'Tuluá',
    direccion: 'Carrera 25 # 25-45',        telefono: '6023447000', email: 'tulua@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-CAL', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.VALLE, cityId: CITY.TULUA },

  { codigo: genCodigo(), nombre: 'Buga',             ciudad: 'Buga',
    direccion: 'Calle 5 # 14-22',           telefono: '6021447000', email: 'buga@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-CAL', baseDia: '150000', limiteAlerta: '40000',
    deptId: DEPT.VALLE, cityId: CITY.BUGA },

  // ── ATLÁNTICO (3) ─────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Barranquilla Centro', ciudad: 'Barranquilla',
    direccion: 'Carrera 44 # 36-56',        telefono: '6055447000', email: 'barranquillacentro@4-72.com.co',
    tipo: 'multipuesto', regional: 'REG-BAR', baseDia: '400000', limiteAlerta: '100000',
    deptId: DEPT.ATLANTICO, cityId: CITY.BARRANQUILLA },

  { codigo: genCodigo(), nombre: 'Barranquilla Norte', ciudad: 'Barranquilla',
    direccion: 'Carrera 52 # 76-50',        telefono: '6055447001', email: 'barranquillanorte@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-BAR', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.ATLANTICO, cityId: CITY.BARRANQUILLA },

  { codigo: genCodigo(), nombre: 'Soledad',          ciudad: 'Soledad',
    direccion: 'Carrera 18 # 17-45',        telefono: '6055447010', email: 'soledad@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-BAR', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.ATLANTICO, cityId: CITY.SOLEDAD },

  // ── BOLÍVAR (3) ───────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Cartagena Centro', ciudad: 'Cartagena',
    direccion: 'Calle del Santísimo # 8-93', telefono: '6056447000', email: 'cartagenacentro@4-72.com.co',
    tipo: 'multipuesto', regional: 'REG-CAR', baseDia: '400000', limiteAlerta: '100000',
    deptId: DEPT.BOLIVAR, cityId: CITY.CARTAGENA },

  { codigo: genCodigo(), nombre: 'Cartagena Bocagrande', ciudad: 'Cartagena',
    direccion: 'Avenida San Martín # 8-142', telefono: '6056447001', email: 'cartagenabocagrande@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-CAR', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.BOLIVAR, cityId: CITY.CARTAGENA },

  { codigo: genCodigo(), nombre: 'Mompós',           ciudad: 'Mompós',
    direccion: 'Calle Real del Medio # 14-45', telefono: '6056447010', email: 'mompos@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-CAR', baseDia: '100000', limiteAlerta: '30000',
    deptId: DEPT.BOLIVAR },

  // ── SANTANDER (3) ─────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Bucaramanga Centro', ciudad: 'Bucaramanga',
    direccion: 'Carrera 19 # 34-37',        telefono: '6076447000', email: 'bucaramangacentro@4-72.com.co',
    tipo: 'multipuesto', regional: 'REG-BUC', baseDia: '350000', limiteAlerta: '80000',
    deptId: DEPT.SANTANDER, cityId: CITY.BUCARAMANGA },

  { codigo: genCodigo(), nombre: 'Bucaramanga Cabecera', ciudad: 'Bucaramanga',
    direccion: 'Carrera 33 # 48-21',        telefono: '6076447001', email: 'bucaramangacabecera@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-BUC', baseDia: '250000', limiteAlerta: '60000',
    deptId: DEPT.SANTANDER, cityId: CITY.BUCARAMANGA },

  { codigo: genCodigo(), nombre: 'Barrancabermeja',  ciudad: 'Barrancabermeja',
    direccion: 'Carrera 12 # 52-34',        telefono: '6076447010', email: 'barrancabermeja@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-BUC', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.SANTANDER, cityId: CITY.BARRANCABERMEJA },

  // ── NORTE DE SANTANDER (1) ────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Cúcuta',           ciudad: 'Cúcuta',
    direccion: 'Avenida 5 # 10-45',         telefono: '6075447000', email: 'cucuta@4-72.com.co',
    tipo: 'multipuesto', regional: 'REG-NSA', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.NSA, cityId: CITY.CUCUTA },

  // ── RISARALDA (2) ─────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Pereira',          ciudad: 'Pereira',
    direccion: 'Carrera 8 # 19-32',         telefono: '6063447000', email: 'pereira@4-72.com.co',
    tipo: 'multipuesto', regional: 'REG-EJE', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.RISARALDA, cityId: CITY.PEREIRA },

  { codigo: genCodigo(), nombre: 'Dosquebradas',     ciudad: 'Dosquebradas',
    direccion: 'Calle 15 # 14-26',          telefono: '6063447001', email: 'dosquebradas@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-EJE', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.RISARALDA, cityId: CITY.DOSQUEBRADAS },

  // ── CALDAS (1) ────────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Manizales',        ciudad: 'Manizales',
    direccion: 'Carrera 23 # 25-28',        telefono: '6068447000', email: 'manizales@4-72.com.co',
    tipo: 'multipuesto', regional: 'REG-EJE', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.CALDAS, cityId: CITY.MANIZALES },

  // ── QUINDÍO (1) ───────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Armenia',          ciudad: 'Armenia',
    direccion: 'Carrera 14 # 21-44',        telefono: '6067447000', email: 'armenia@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-EJE', baseDia: '250000', limiteAlerta: '60000',
    deptId: DEPT.QUINDIO, cityId: CITY.ARMENIA },

  // ── TOLIMA (1) ────────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Ibagué',           ciudad: 'Ibagué',
    direccion: 'Carrera 3 # 12-44',         telefono: '6082447000', email: 'ibague@4-72.com.co',
    tipo: 'multipuesto', regional: 'REG-CEN', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.TOLIMA, cityId: CITY.IBAGUE },

  // ── HUILA (1) ─────────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Neiva',            ciudad: 'Neiva',
    direccion: 'Carrera 5 # 7-25',          telefono: '6088447000', email: 'neiva@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-CEN', baseDia: '250000', limiteAlerta: '60000',
    deptId: DEPT.HUILA, cityId: CITY.NEIVA },

  // ── NARIÑO (1) ────────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Pasto',            ciudad: 'Pasto',
    direccion: 'Calle 19 # 24-21',          telefono: '6072447000', email: 'pasto@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-SUR', baseDia: '250000', limiteAlerta: '60000',
    deptId: DEPT.NARINO, cityId: CITY.PASTO },

  // ── CAUCA (1) ─────────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Popayán',          ciudad: 'Popayán',
    direccion: 'Carrera 7 # 5-53',          telefono: '6028447000', email: 'popayan@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-SUR', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.CAUCA, cityId: CITY.POPAYAN },

  // ── BOYACÁ (1) ────────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Tunja',            ciudad: 'Tunja',
    direccion: 'Calle 20 # 11-20',          telefono: '6087447000', email: 'tunja@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-CEN', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.BOYACA },

  // ── META (1) ──────────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Villavicencio',    ciudad: 'Villavicencio',
    direccion: 'Carrera 31 # 38-17',        telefono: '6086447000', email: 'villavicencio@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-ORI', baseDia: '250000', limiteAlerta: '60000',
    deptId: DEPT.META, cityId: CITY.VILLAVICENCIO },

  // ── CESAR (1) ─────────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Valledupar',       ciudad: 'Valledupar',
    direccion: 'Carrera 5 # 16-36',         telefono: '6085447000', email: 'valledupar@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-COS', baseDia: '250000', limiteAlerta: '60000',
    deptId: DEPT.CESAR, cityId: CITY.VALLEDUPAR },

  // ── CÓRDOBA (2) ───────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Montería',         ciudad: 'Montería',
    direccion: 'Carrera 2 # 27-16',         telefono: '6047447000', email: 'monteria@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-COS', baseDia: '250000', limiteAlerta: '60000',
    deptId: DEPT.CORDOBA, cityId: CITY.MONTERIA },

  { codigo: genCodigo(), nombre: 'Lorica',           ciudad: 'Lorica',
    direccion: 'Carrera 4 # 10-23',         telefono: '6047447001', email: 'lorica@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-COS', baseDia: '150000', limiteAlerta: '40000',
    deptId: DEPT.CORDOBA, cityId: CITY.LORICA },

  // ── SUCRE (1) ─────────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Sincelejo',        ciudad: 'Sincelejo',
    direccion: 'Carrera 22 # 16-24',        telefono: '6094447000', email: 'sincelejo@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-COS', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.SUCRE, cityId: CITY.SINCELEJO },

  // ── MAGDALENA (3) ─────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Santa Marta',      ciudad: 'Santa Marta',
    direccion: 'Carrera 3 # 18-40',         telefono: '6054447000', email: 'santamarta@4-72.com.co',
    tipo: 'multipuesto', regional: 'REG-COS', baseDia: '300000', limiteAlerta: '80000',
    deptId: DEPT.MAGDALENA, cityId: CITY.SANTA_MARTA },

  { codigo: genCodigo(), nombre: 'Ciénaga',          ciudad: 'Ciénaga',
    direccion: 'Carrera 9 # 12-17',         telefono: '6054447001', email: 'cienaga@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-COS', baseDia: '150000', limiteAlerta: '40000',
    deptId: DEPT.MAGDALENA },

  { codigo: genCodigo(), nombre: 'El Banco',         ciudad: 'El Banco',
    direccion: 'Carrera 5 # 8-34',          telefono: '6054447010', email: 'elbanco@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-COS', baseDia: '100000', limiteAlerta: '30000',
    deptId: DEPT.MAGDALENA },

  // ── LA GUAJIRA (2) ────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Riohacha',         ciudad: 'Riohacha',
    direccion: 'Carrera 7 # 2-08',          telefono: '6057447000', email: 'riohacha@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-COS', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.GUAJIRA, cityId: CITY.RIOHACHA },

  { codigo: genCodigo(), nombre: 'Maicao',           ciudad: 'Maicao',
    direccion: 'Carrera 10 # 11-25',        telefono: '6057447001', email: 'maicao@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-COS', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.GUAJIRA, cityId: CITY.MAICAO },

  // ── CAQUETÁ (1) ───────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Florencia',        ciudad: 'Florencia',
    direccion: 'Carrera 13 # 15-27',        telefono: '6094447010', email: 'florencia@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-AMZ', baseDia: '150000', limiteAlerta: '40000',
    deptId: DEPT.CAQUETA, cityId: CITY.FLORENCIA },

  // ── PUTUMAYO (1) ──────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Mocoa',            ciudad: 'Mocoa',
    direccion: 'Carrera 5 # 7-14',          telefono: '6094447020', email: 'mocoa@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-SUR', baseDia: '150000', limiteAlerta: '40000',
    deptId: DEPT.PUTUMAYO, cityId: CITY.MOCOA },

  // ── CHOCÓ (1) ─────────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Quibdó',           ciudad: 'Quibdó',
    direccion: 'Carrera 2 # 24-12',         telefono: '6074447000', email: 'quibdo@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-CHO', baseDia: '150000', limiteAlerta: '40000',
    deptId: DEPT.CHOCO, cityId: CITY.QUIBDO },

  // ── ARAUCA (1) ────────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Arauca',           ciudad: 'Arauca',
    direccion: 'Carrera 20 # 19-14',        telefono: '6097447000', email: 'arauca@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-ORI', baseDia: '150000', limiteAlerta: '40000',
    deptId: DEPT.ARAUCA, cityId: CITY.ARAUCA },

  // ── CASANARE (1) ──────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Yopal',            ciudad: 'Yopal',
    direccion: 'Carrera 19 # 10-30',        telefono: '6098447000', email: 'yopal@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-ORI', baseDia: '150000', limiteAlerta: '40000',
    deptId: DEPT.CASANARE, cityId: CITY.YOPAL },

  // ── CUNDINAMARCA (3) ──────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Soacha',           ciudad: 'Soacha',
    direccion: 'Carrera 6 # 14-20',         telefono: '6017447020', email: 'soacha@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-BOG', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.CUNDINAMARCA, cityId: CITY.SOACHA },

  { codigo: genCodigo(), nombre: 'Facatativá',       ciudad: 'Facatativá',
    direccion: 'Carrera 4 # 8-14',          telefono: '6091447000', email: 'facatativa@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-BOG', baseDia: '150000', limiteAlerta: '40000',
    deptId: DEPT.CUNDINAMARCA, cityId: CITY.FACATATIVA },

  { codigo: genCodigo(), nombre: 'Girardot',         ciudad: 'Girardot',
    direccion: 'Carrera 9 # 14-26',         telefono: '6083447000', email: 'girardot@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-BOG', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.CUNDINAMARCA, cityId: CITY.GIRARDOT_CUN },

  // ── SAN ANDRÉS (1) ────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'San Andrés',       ciudad: 'San Andrés',
    direccion: 'Avenida Newball # 3-60',    telefono: '6085447010', email: 'sanandres@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-INS', baseDia: '200000', limiteAlerta: '50000',
    deptId: DEPT.SAN_ANDRES, cityId: CITY.SAN_ANDRES },

  // ── AMAZONAS (1) ──────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Leticia',          ciudad: 'Leticia',
    direccion: 'Carrera 11 # 8-38',         telefono: '6098447010', email: 'leticia@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-AMZ', baseDia: '150000', limiteAlerta: '40000',
    deptId: DEPT.AMAZONAS, cityId: CITY.LETICIA },

  // ── VICHADA (1) ───────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Puerto Carreño',   ciudad: 'Puerto Carreño',
    direccion: 'Carrera 5 # 4-20',          telefono: '6098447020', email: 'puertocarreno@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-ORI', baseDia: '100000', limiteAlerta: '30000',
    deptId: DEPT.VICHADA, cityId: CITY.PUERTO_CARRENO },

  // ── VAUPÉS (1) ────────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Mitú',             ciudad: 'Mitú',
    direccion: 'Carrera 2 # 12-10',         telefono: '6098447030', email: 'mitu@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-AMZ', baseDia: '100000', limiteAlerta: '30000',
    deptId: DEPT.VAUPES, cityId: CITY.MITU },

  // ── GUAVIARE (1) ──────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'San José del Guaviare', ciudad: 'San José del Guaviare',
    direccion: 'Carrera 19 # 7-26',         telefono: '6098447040', email: 'sanjosedelguaviare@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-AMZ', baseDia: '100000', limiteAlerta: '30000',
    deptId: DEPT.GUAVIARE, cityId: CITY.SAN_JOSE_GUAVIARE },

  // ── GUAINÍA (1) ───────────────────────────────────────────────────────────
  { codigo: genCodigo(), nombre: 'Puerto Inírida',   ciudad: 'Puerto Inírida',
    direccion: 'Carrera 6 # 15-14',         telefono: '6098447050', email: 'puertoinirida@4-72.com.co',
    tipo: 'unipersonal', regional: 'REG-AMZ', baseDia: '100000', limiteAlerta: '30000',
    deptId: DEPT.GUAINIA, cityId: CITY.PUERTO_INIRIDA },
]

// ── Main ──────────────────────────────────────────────────────────────────────

const HORA_RESET = (() => { const d = new Date(0); d.setUTCHours(8, 0, 0, 0); return d })()

async function main() {
  console.log(`\n🇨🇴  Seed 4-72 — ${SUCURSALES.length} sucursales | 1 CajaPadre (Bogotá) | 1 caja POS c/u\n`)

  // 0. Comercio
  const comercio = await prisma.comercio.upsert({
    where:  { codigocomercios: '4-72' },
    update: {},
    create: {
      codigocomercios: '4-72',
      nombrecomercios: 'Servicios Postales Nacionales S.A.',
      nitcomercios:    '830113400-3',
      activocomercios: true,
    },
  })

  // 1. Regionales
  const regMap = new Map<CodigoReg, number>()
  for (const r of REGIONALES) {
    const reg = await prisma.regional.upsert({
      where:  { codigoregionales: r.codigo },
      update: {},
      create: { codigoregionales: r.codigo, nombreregionales: r.nombre, activoregionales: true, comercios_idcomercios: comercio.idcomercios },
    })
    regMap.set(r.codigo, reg.idregionales)
  }
  console.log(`  ✓ ${REGIONALES.length} regionales\n`)

  // 2. Sucursales — guarda la de Bogotá Centro (primera, código '1001')
  let bogotaSucursalId = 0

  for (const s of SUCURSALES) {
    const regionalId = regMap.get(s.regional)!
    const suc = await prisma.sucursal.upsert({
      where:  { codigosucursales: s.codigo },
      update: {
        ...(s.deptId && { departamentos_iddepartamentos: s.deptId }),
        ...(s.cityId && { ciudades_idciudades:           s.cityId }),
        paises_idpaises: GEO_COLOMBIA,
      },
      create: {
        codigosucursales:              s.codigo,
        nombresucursales:              s.nombre,
        direccionsucursales:           s.direccion,
        tiposucursales:                s.tipo,
        telefonosucursales:            s.telefono,
        emailsucursales:               s.email,
        activosucursales:              true,
        regionales_idregionales:       regionalId,
        paises_idpaises:               GEO_COLOMBIA,
        departamentos_iddepartamentos: s.deptId ?? null,
        ciudades_idciudades:           s.cityId ?? null,
      },
    })
    if (s.codigo === '1001') bogotaSucursalId = suc.idsucursales
  }
  console.log(`  ✓ ${SUCURSALES.length} sucursales\n`)

  // 3. UN solo CajaPadre — pertenece a Bogotá Centro
  let cajaPadre = await prisma.cajaPadre.findFirst({
    where: { sucursales_idsucursales: bogotaSucursalId, deleted_atcajas_padres: null },
  })
  if (!cajaPadre) {
    cajaPadre = await prisma.cajaPadre.create({
      data: {
        sucursales_idsucursales:  bogotaSucursalId,
        nombrecajas_padres:       'Central 4-72',
        base_generalcajas_padres: '50000000',
        hora_resetcajas_padres:   HORA_RESET,
      },
    })
    console.log(`  ✓ CajaPadre creada: "Central 4-72" (id=${cajaPadre.idcajas_padres})\n`)
  } else {
    console.log(`  ✓ CajaPadre existente: id=${cajaPadre.idcajas_padres}\n`)
  }

  // 4. Eliminar (soft-delete) todos los CajaPadres que NO son el central
  const eliminados = await prisma.cajaPadre.updateMany({
    where: {
      idcajas_padres:        { not: cajaPadre.idcajas_padres },
      deleted_atcajas_padres: null,
    },
    data: { deleted_atcajas_padres: new Date() },
  })
  if (eliminados.count > 0) {
    console.log(`  🗑  ${eliminados.count} CajaPadres extra eliminados\n`)
  }

  // 5. Cajas POS — una por sucursal, todas apuntan al mismo CajaPadre
  let total = 0
  for (const s of SUCURSALES) {
    const suc = await prisma.sucursal.findFirst({ where: { codigosucursales: s.codigo } })
    if (!suc) continue

    await prisma.caja.upsert({
      where: {
        codigocajas_sucursales_idsucursales: {
          codigocajas:             s.codigo,
          sucursales_idsucursales: suc.idsucursales,
        },
      },
      update: {
        cajas_padres_idcajas_padres: cajaPadre.idcajas_padres,
      },
      create: {
        sucursales_idsucursales:     suc.idsucursales,
        cajas_padres_idcajas_padres: cajaPadre.idcajas_padres,
        codigocajas:                 s.codigo,
        nombrecajas:                 `Caja ${s.codigo}`,
        tipocajas:                   'pos',
        base_diacajas:               s.baseDia,
        limite_alertacajas:          s.limiteAlerta ?? null,
        activocajas:                 true,
      },
    })
    total++
    console.log(`  ✓ [${s.codigo}] ${s.nombre.padEnd(30)} → cajaPadre #${cajaPadre.idcajas_padres}`)
  }

  console.log(`\n✅ 1 CajaPadre | ${total} cajas POS → todas apuntan a id=${cajaPadre.idcajas_padres}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
