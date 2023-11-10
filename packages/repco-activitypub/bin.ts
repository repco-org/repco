import 'source-map-support/register.js'
import Dotenv from 'dotenv'
import express from 'express'
import { initActivityPub } from './src/server.js'

Dotenv.config()
Dotenv.config({ path: '../../.env' })

const app = express()

initActivityPub(app, {
  prefix: '/ap',
  api: {
    prefix: '/api/ap',
    auth: async (_req) => {
      // todo: authentication
      return true
    },
  },
})

const port = process.env.PORT || 8765
app.listen(port, () => {
  console.log('listening on http://localhost:' + port)
})
