import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env file from project root
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DIRECT_DATABASE_URL or DATABASE_URL must be set in .env')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash1 = await bcrypt.hash('Bslctr@253027', 10)
  const hash2 = await bcrypt.hash('Bslctr@2025', 10)
  const hash3 = await bcrypt.hash('Bslctr@2026', 10)

  await prisma.user.upsert({
    where: { email: 'bslctr2022@gmail.com' },
    update: {
      name: 'Admin BSLCTR',
      password: hash1,
      role: 'ADMIN',
    },
    create: { email: 'bslctr2022@gmail.com', name: 'Admin BSLCTR', password: hash1, role: 'ADMIN' }
  })

  const legacyDoctor = await prisma.user.findUnique({
    where: { email: 'shahariar.dmc@gmail.com' },
  })

  if (legacyDoctor) {
    await prisma.user.update({
      where: { email: 'shahariar.dmc@gmail.com' },
      data: {
        email: 'shahariar.dmc@data4research.com',
        name: 'Dr. Shahariar',
        password: hash2,
        role: 'DOCTOR',
      },
    })
  } else {
    await prisma.user.upsert({
      where: { email: 'shahariar.dmc@data4research.com' },
      update: {
        name: 'Dr. Shahariar',
        password: hash2,
        role: 'DOCTOR',
      },
      create: { email: 'shahariar.dmc@data4research.com', name: 'Dr. Shahariar', password: hash2, role: 'DOCTOR' }
    })
  }

  await prisma.user.upsert({
    where: { email: 'tanvir@data4research.com' },
    update: {
      name: 'Tanvir',
      password: hash3,
      role: 'DOCTOR',
    },
    create: { email: 'tanvir@data4research.com', name: 'Tanvir', password: hash3, role: 'DOCTOR' }
  })

  await prisma.user.updateMany({
    where: { email: 'shariar.dmc@gmail.com' },
    data: { email: 'archived+shariar.dmc@data4research.com' },
  })

  // Seed Option data for dropdowns
  await prisma.option.deleteMany({})

  const religions = ["Islam", "Hinduism", "Christian", "Buddhism", "Sikhism", "Judaism", "Confucianism"]
  const ethnicities = [
    { label: "Caucasian / European descent", value: "caucasian" },
    { label: "African / African-American", value: "african" },
    { label: "South Asian", value: "south-asian" },
    { label: "East Asian", value: "east-asian" },
    { label: "Southeast Asian", value: "southeast-asian" },
    { label: "Middle Eastern / Arab", value: "middle-eastern" },
    { label: "Native American / Indigenous Peoples", value: "native-american" },
    { label: "Pacific Islander / Polynesian / Micronesian", value: "pacific-islander" },
    { label: "Hispanic / Latino", value: "hispanic" },
    { label: "Aboriginal / Indigenous Australian", value: "aboriginal-australian" },
    { label: "Jewish (Ashkenazi, Sephardic, Mizrahi)", value: "jewish" },
    { label: "Mediterranean", value: "mediterranean" },
    { label: "Scandinavian / Northern European", value: "scandinavian" },
    { label: "Black Caribbean", value: "black-caribbean" },
    { label: "Mixed Ethnicity (Multiracial)", value: "mixed-ethnicity" }
  ]
  const districts = [
    "Dhaka", "Chattogram", "Khulna", "Rajshahi", "Barishal", "Sylhet", "Rangpur", "Mymensingh",
    "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj",
    "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail", "Brahmanbaria", "Chandpur",
    "Comilla", "Cox's Bazar", "Feni", "Lakshmipur", "Noakhali", "Bandarban", "Khagrachhari",
    "Rangamati", "Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia", "Magura",
    "Meherpur", "Narail", "Satkhira", "Bogra", "Joypurhat", "Naogaon", "Natore", "Chapainawabganj",
    "Pabna", "Rajshahi", "Sirajganj", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari",
    "Panchagarh", "Rangpur", "Thakurgaon", "Habiganj", "Moulvibazar", "Sunamganj", "Sylhet",
    "Barguna", "Barishal", "Bhola", "Jhalokathi", "Patuakhali", "Pirojpur"
  ]

  await prisma.option.createMany({
    data: [
      // Religions
      ...religions.map((r, i) => ({
        category: "religion",
        label: r,
        value: r.toLowerCase(),
        order: i
      })),
      // Ethnicities
      ...ethnicities.map((e, i) => ({
        category: "ethnicity",
        label: e.label,
        value: e.value,
        order: i
      })),
      // Districts
      ...districts.map((d, i) => ({
        category: "district",
        label: d,
        value: d.toLowerCase().replace(/ /g, "-"),
        order: i
      }))
    ]
  })

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })