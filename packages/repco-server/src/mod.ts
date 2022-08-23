import 'express-async-errors'
import * as error from './error.js'
import cors from 'cors'
import express from 'express'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { graphqlHTTP } from 'express-graphql'
import { PrismaClient } from 'repco-core'
import Routes from './routes.js'

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

  const resolvers = {
    Query: {
      allContentItems: () => {
        return prisma.contentItem.findMany()
      },
    },
  }

  const typeDefs = `
  type contentItem {
    uid: String!
    title: String
  }

  type Query {
    allContentItems: [contentItem!]!
  }
`
  const schema = makeExecutableSchema({
    resolvers,
    typeDefs,
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
