import 'reflect-metadata'
// @ts-ignore
import 'express-async-errors'
import * as error from './error.js'
import cors from 'cors'
import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import { PrismaClient } from 'repco-core'
import { buildSchemaSync } from 'type-graphql'
import Routes from './routes.js'
import { typegraphql } from 'repco-prisma'

export function runServer(prisma: PrismaClient, port: number) {
  const app = express()

  app.use(express.json({ limit: '100mb' }))
  app.use(cors())
  app.use(express.urlencoded({ extended: true }))

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
  const schema = buildSchemaSync({
    resolvers: typegraphql.resolvers,
    validate: false,
  })
  Routes.use(
    '/graphql',
    graphqlHTTP({
      schema: schema,
      graphiql: true,
      context: { prisma: prisma },
    }),
  )

  return app.listen(port, () => {
    console.log(`Repco server listening on http://localhost:${port}`)
  })
}
