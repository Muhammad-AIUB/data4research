import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env file
config({ path: resolve(process.cwd(), '.env') })

export default {
  datasource: {
    url: process.env.DATABASE_URL || '',
  },
}

