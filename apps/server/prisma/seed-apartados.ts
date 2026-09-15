/**
 * seed-apartados.ts
 * Carga las casillas reales de apartados postales en todas las sucursales activas.
 * Solo borra casillas libres (sin cliente asignado) antes de recrear.
 * Seguro de re-ejecutar.
 *
 * Ejecutar desde apps/server/:
 *   DATABASE_URL=... npx tsx prisma/seed-apartados.ts
 */
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool    = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter } as never)

const CASILLAS_REALES = [
  '102192', '149', '17118', '18383', '18416', '18417', '18418', '18419',
  '18425', '18426', '18427', '201863', '2584', '358368', '358369', '358371',
  '358372', '358373', '358374', '358375', '360662', '360709', '360760',
  '360761', '360762', '360763', '360764', '360765', '360766', '360767',
  '360768', '360769', '360770', '360771', '360773', '360774', '360776',
  '360777', '360779', '360781', '360782', '360783', '360787', '360788',
  '360789', '360790', '360791', '360792', '360793', '360794', '360795',
  '360796', '360797', '360799', '360800', '360803', '360804', '360806',
  '360809', '360810', '360812', '360813', '360815', '360816', '360817',
  '360818', '360820', '360830', '360831', '360833', '360838', '360839',
  '360840', '360842', '360843', '360845', '360850', '360851', '360852',
  '360853', '360854', '360855', '360856', '360857', '360858', '360859',
  '360860', '360861', '360862', '360863', '360864', '360865', '360866',
  '360867', '360868', '360869', '360870', '360872', '360873', '360874',
  '360875', '360876', '360877', '360878', '360879', '361855', '361856',
  '361857', '361859', '361860', '361861', '361862', '361863', '361864',
  '361865', '361866', '361867', '361868', '361869', '361871', '361872',
  '361873', '361874', '361875', '361876', '361877', '361878', '361880',
  '361881', '361882', '361884', '361885', '361886', '361887', '361888',
  '361889', '361892', '361893', '361896', '361898', '361899', '361900',
  '361901', '361903', '361905', '361906', '361907', '361908', '361909',
  '361910', '361912', '361913', '361914', '361915', '361916', '361917',
  '361918', '361919', '361920', '361921', '361922', '361923', '361924',
  '361925', '361926', '361927', '361928', '361929', '361930', '361931',
  '361932', '361933', '361934', '361935', '361936', '361937', '361938',
  '361939', '361940', '361941', '361942', '361943', '361944', '361945',
  '361946', '361947', '361948', '361949', '361950', '361951', '361952',
  '361953', '361954', '361955', '361956', '361957', '57712', '57713',
  '7-1-200277', '7-1-200294', '7067002', '853001', '93953',
  'AA 18282', 'AA 51224', 'AA 853011', 'AA076478', 'AA100178', 'AA1110',
  'AA11383', 'AA12058', 'AA13729', 'AA13820', 'AA13884', 'AA14331',
  'AA16257', 'AA18186', 'AA18470', 'AA19585', 'AA20220', 'AA20262',
  'AA20485', 'AA20726', 'AA22716', 'AA23003', 'AA2323', 'AA240868',
  'AA24607', 'AA250316', 'AA25379', 'AA26152', 'AA27396', 'AA2762',
  'AA30197', 'AA31147', 'AA33398', 'AA34225', 'AA355077', 'AA36162',
  'AA3784', 'AA46794', 'AA49132', 'AA50818', 'AA51146', 'AA51350',
  'AA52291', 'AA54725', 'AA54860', 'AA55700', 'AA7189', 'AA7438',
  'AA75146', 'AA75784', 'AA75874', 'AA75976', 'AA77092', 'AA7744',
  'AA80333', 'AA8224', 'AA842', 'AA8655', 'AA8691', 'AA8852', 'AA9079',
  'AP 150072', 'AP7189',
]

async function main() {
  console.log('🌱 Cargando apartados postales...\n')

  const sucursales = await (prisma as any).sucursal.findMany({
    where: { activosucursales: true },
    select: { idsucursales: true, nombresucursales: true },
  })

  if (sucursales.length === 0) {
    console.error('❌ No hay sucursales activas en la BD. Ejecuta el seed principal primero.')
    process.exit(1)
  }

  let total = 0
  for (const suc of sucursales) {
    await (prisma as any).apartadoPostal.deleteMany({
      where: { sucursales_idsucursales: suc.idsucursales, clientes_idclientes: null },
    })
    const { count } = await (prisma as any).apartadoPostal.createMany({
      data: CASILLAS_REALES.map(numero => ({
        sucursales_idsucursales:       suc.idsucursales,
        numeroapartados_postales:      numero,
        tamanoapartados_postales:      'pequeno',
        estadoapartados_postales:      'disponible',
        valorapartados_postales:       '54800',
        incluye_ivaapartados_postales: false,
      })),
      skipDuplicates: true,
    })
    console.log(`✓ ${suc.nombresucursales}: ${count} casillas cargadas`)
    total += count
  }

  console.log(`\n✅ Total: ${total} apartados postales en ${sucursales.length} sucursal(es).`)
}

main()
  .catch(e => { console.error('\n❌ Error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect().then(() => pool.end()))
