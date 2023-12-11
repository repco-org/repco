import 'source-map-support/register.js'
import Dotenv from 'dotenv'
import express from 'express'
import { PrismaClient } from 'repco-prisma'
import { ActivityPub, mountActivityPub } from './src/server.js'

Dotenv.config()
Dotenv.config({ path: '../../.env' })

const app = express()

const port = process.env.PORT || 8765
const baseUrl = process.env.REPCO_URL || `http://localhost:${port}`
const apUrl = baseUrl + '/ap'

const db = new PrismaClient()
const ap = new ActivityPub(db, apUrl)

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

app.listen(port, () => {
  console.log('listening on http://localhost:' + port)
})
