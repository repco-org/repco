import express from 'express'
import { Request, Response } from 'express'
import { PrismaClient, fetchRevisions, ingestRevisions } from 'repco-core'
import { Prisma } from '@prisma/client'
import { ServerError } from './error.js'
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

router.get('/error', async (req, res) => {
  throw new ServerError(400, 'bad')
})

router.use(Changes)

export default router
