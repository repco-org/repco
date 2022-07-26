// @ts-ignore
import 'express-async-errors'
import { PrismaClient } from 'repco-core'
import express from 'express'
import cors from 'cors'
import * as error from './error.js'
import Routes from './routes.js'

export function runServer (prisma: PrismaClient, port: number) {
  const app = express()
  app.use(express.json({ limit: '100mb' }))
  app.use(cors())

  app.use((req, res, next) => {
    console.log('HTTP', req.method, req.path)
    res.locals.prisma = prisma
    next()
  })

  app.use((req, res, next) => {
    if (!req.header('content-type')) {
      req.headers['content-type'] = 'application/json'
    }
    res.locals.prisma = prisma
    next()
  })

  app.use('/', Routes)

  app.use(error.notFoundHandler)
  app.use(error.handler)

  return app.listen(port, () => {
    console.log(`Repco server listening on http://localhost:${port}`)
  })
}
