import express from 'express'
import { Repo } from 'repco-core'
import Changes from './routes/changes.js'
import { getLocals } from './lib.js'

const router = express.Router()

router.get('/', async (req, res) => {
  res.send('hello, world')
})

router.get('/repos', async (req, res) => {
  res.json(await Repo.list(getLocals(res).prisma))
})

router.get('/health', (req, res) => {
  res.send({ ok: true })
})

router.use(Changes)

export default router
