import 'source-map-support/register.js'
import Dotenv from 'dotenv'
import express from 'express'
import { PrismaClient } from 'repco-prisma'
import { ActivityPub, mountActivityPub } from './src/server.js'

Dotenv.config()
Dotenv.config({ path: '../../.env' })

const app = express()

if (!process.env.REPCO_URL) {
  throw new Error('Missing REPCO_URL environment variable')
}
const baseUrl = process.env.REPCO_URL + '/ap'

const db = new PrismaClient()
const ap = new ActivityPub(db, baseUrl)

mountActivityPub(app, ap, {
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
