import Dotenv from 'dotenv'
import { PrismaClient } from 'repco-core'
import { runServer } from './src/lib.js'

Dotenv.config()
Dotenv.config({ path: '../../.env' })

const prisma = new PrismaClient()
runServer(prisma, Number(process.env.PORT) || 8765)
