require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

const SALT_ROUNDS = 12
const DM_USERNAME = 'dm'
const DM_DEFAULT_PIN = '0000'

async function main() {
  console.log('[seed] Starting...')

  const existing = await prisma.user.findUnique({ where: { username: DM_USERNAME } })

  if (existing) {
    console.log(`[seed] DM account "${DM_USERNAME}" already exists — skipping.`)
  } else {
    const pinHash = await bcrypt.hash(DM_DEFAULT_PIN, SALT_ROUNDS)
    const dm = await prisma.user.create({
      data: {
        username: DM_USERNAME,
        pinHash,
        role: 'DM',
        mustChangePIN: true, // Force PIN change on first login
      },
    })
    console.log(`[seed] Created DM account: "${dm.username}" (id: ${dm.id})`)
    console.log(`[seed] ⚠  Default PIN is ${DM_DEFAULT_PIN} — you MUST change it on first login.`)
  }

  console.log('[seed] Done.')
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
