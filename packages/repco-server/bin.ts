import Dotenv from 'dotenv'
import { PrismaClient } from 'repco-core'
import { runServer } from './lib.js'

Dotenv.config()
const prisma = new PrismaClient()
runServer(prisma, Number(process.env.PORT) || 8765)
