// @ts-ignore
import 'express-async-errors'
import * as error from './error.js'
import cors from 'cors'
import express from 'express'
import { PrismaClient } from 'repco-core'
import { createGraphqlHandler } from 'repco-graphql'
import Routes from './routes.js'

export function runServer(prisma: PrismaClient, port: number) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required.')
  }
  const app = express()
  app.use(express.json({ limit: '100mb' }))
  app.use(cors())
  app.use(createGraphqlHandler(process.env.DATABASE_URL))
  app.use((req, res, next) => {
    res.locals.prisma = prisma
    next()
  })
  app.use((req, res, next) => {
    if (!req.header('content-type')) {
      req.headers['content-type'] = 'application/json'
    }
    next()
  })

  app.use('/', Routes)

  app.use(error.notFoundHandler)
  app.use(error.handler)

  return app.listen(port, () => {
    console.log(`Repco server listening on http://localhost:${port}`)
  })
}
