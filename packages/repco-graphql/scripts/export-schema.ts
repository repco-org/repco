import Dotenv from 'dotenv'
import fs from 'fs/promises'
import { printSchema } from 'graphql'
import { createGraphQlSchema } from '../src/lib.js'

Dotenv.config({ path: '../../.env' })

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required')
  }
  const schema = await createGraphQlSchema(process.env.DATABASE_URL)
  const dir = './generated'
  await fs.mkdir(dir, { recursive: true })
  const path = './generated/schema.graphql'
  await fs.writeFile(path, printSchema(schema))
  console.log(`GraphQL schema exported to ${path}`)
}
