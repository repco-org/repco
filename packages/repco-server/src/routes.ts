import express from 'express'
import { Response } from 'express'
import { PrismaClient } from 'repco-core'
import Changes from './routes/changes.js'

export type Locals = {
  prisma: PrismaClient
}

export function getLocals(res: Response): Locals {
  if (!res.locals.prisma) {
    throw new Error('Missing prisma client')
  }
  const prisma = res.locals.prisma as PrismaClient
  return { prisma }
}


const router = express.Router()

router.get('/', async (req, res) => {
  res.send('hello, world')
})

router.get('/health', (req, res) => {
  res.send({ ok: true })
})

router.use(Changes)

export default router
