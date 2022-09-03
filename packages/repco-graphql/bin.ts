// Minimal standalone GraphQL server

import Dotenv from 'dotenv'
import express from 'express'
import { createGraphqlHandler, getSDL } from './src/lib.js'

Dotenv.config({ path: '../../.env' })
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environement variable is required.')
}

const app = express()
app.use(createGraphqlHandler(process.env.DATABASE_URL))
app.get('/schema.gql', (req, res) => {
  const sdl = getSDL()
  if (!sdl) {
    return res.status(500).end('Schema cannot be loaded')
  }
  res.contentType('text/plain').end(sdl)
})

const port = process.env.PORT || 5001
app.listen(port, () => {
  console.log(`=> server running at http://localhost:${port}/graphiql`)
})

// Use this for querying GraphQL via GET requests
// app.use('/graphql', (req, _res, next) => {
//   if (req.method === 'GET') {
//     req.method = 'POST'
//     req.body = {
//       query: req.query.query,
//       operationName: req.query.operationName,
//       variables: req.query.variables,
//     }
//   }
//   next()
// })
