// @ts-ignore
import 'express-async-errors'
import * as error from './error.js'
import cors from 'cors'
import express, { Response } from 'express'
import pinoHttp from 'pino-http'
import { createHttpTerminator } from 'http-terminator'
import { createLogger, Logger } from 'repco-common'
import { PrismaClient } from 'repco-core'
import { createGraphqlHandler, createPoolFromUrl } from 'repco-graphql'
import Routes from './routes.js'

const logger = pinoHttp({
  logger: createLogger('server'),
  useLevel: 'debug',
  redact: ['req.headers.authorization'],
})

export type Locals = {
  prisma: PrismaClient
  log: Logger
}

export function getLocals(res: Response): Locals {
  if (!res.locals.prisma) {
    throw new Error('Missing prisma client')
  }
  const prisma = res.locals.prisma as PrismaClient
  const log = res.locals.log as Logger
  return { prisma, log }
}

export function runServer(prisma: PrismaClient, port: number) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required.')
  }
  const pgPool = createPoolFromUrl(process.env.DATABASE_URL)
  const graphqlHandler = createGraphqlHandler(pgPool)

  const app = express()
  app.use(logger)
  app.use(express.json({ limit: '100mb' }))
  app.use(cors())
  app.use(graphqlHandler)
  app.use((_req, res, next) => {
    res.locals.prisma = prisma
    res.locals.log = logger.logger
    next()
  })
  app.use((req, _res, next) => {
    if (!req.header('content-type')) {
      req.headers['content-type'] = 'application/json'
    }
    if (!req.header('accept')) {
      req.headers['accept'] = 'application/json'
    }
    next()
  })

  app.use('/', Routes)

  app.use(error.notFoundHandler)
  app.use(error.handler)

  const server = app.listen(port, () => {
    logger.logger.info(`Repco server listening on http://localhost:${port}`)
  })

  const isReady = new Promise((resolve, reject) => {
    server.once('error', reject)
    server.once('listening', resolve)
  })

  const terminator = createHttpTerminator({ server })

  const shutdown = async () => {
    await Promise.all([
      pgPool.end(),
      graphqlHandler.release(),
      terminator.terminate(),
    ])
  }

  return {
    app,
    server,
    shutdown,
    isReady,
  }
}
