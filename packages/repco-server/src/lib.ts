// @ts-ignore
import 'express-async-errors'
import * as error from './error.js'
import cors from 'cors'
import express, { Response } from 'express'
import pinoHttp from 'pino-http'
import { createHttpTerminator } from 'http-terminator'
import {
  ActivityPub,
  mountActivityPub,
  setGlobalApInstance,
} from 'repco-activitypub'
import { createLogger, Logger } from 'repco-common'
import { PrismaClient } from 'repco-core'
import { createGraphqlHandler, createPoolFromUrl } from 'repco-graphql'
import Routes from './routes.js'
import { authorizeRequest } from './routes/admin.js'

export const logger = createLogger('server')

const httpLogger = pinoHttp({
  logger,
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

  app.use(httpLogger)
  app.use((req, res, next) => {
    console.log(req.url, req.method, req.headers.accept)
    next()
  })
  app.use(express.json({ limit: '100mb' }))
  app.use(cors())

  app.use(graphqlHandler)
  app.use((_req, res, next) => {
    res.locals.prisma = prisma
    res.locals.log = logger
    next()
  })

  if (!process.env.REPCO_URL) {
    logger.warn(
      'Missing REPCO_URL environment variable, activitypub is disabled',
    )
  } else {
    const ap = new ActivityPub(prisma, process.env.REPCO_URL + '/ap')
    mountActivityPub(app, ap, {
      prefix: '/ap',
      api: {
        prefix: '/api/ap',
        auth: async (req) => {
          return authorizeRequest(req)
        },
      },
    })
    setGlobalApInstance(ap)
  }

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
    httpLogger.logger.info(`Repco server listening on http://localhost:${port}`)
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
