import express from 'express'
import { fetchRevisions, ingestRevisions, RevisionCreateInput } from 'repco-core'
import { getLocals } from '../routes.js'
import { ServerError } from '../error.js'
import { batchAsyncIterator, parseNdjsonLines } from "../util.js"

const router = express.Router()

const HEADER_JSON = 'application/json'
const HEADER_NDJSON = 'application/x-ndjson'

router.get('/changes', async (req, res) => {
  const { prisma } = getLocals(res)
  const opts = {
    from: req.query.from?.toString()
  }
  const revisions = await fetchRevisions(prisma, opts)

  if (req.query.format?.toString() === 'ndjson') {
    return sendNdJson(res, revisions)
  }

  res.json(revisions)
})

router.put('/changes', async (req, res) => {
  const { prisma } = getLocals(res)
  if (req.header('content-type') === HEADER_JSON) {
    const revisions = req.body
    await ingestRevisions(prisma, revisions)
    return res.send({ ok: true })
  }
  if (req.header('content-type') === HEADER_NDJSON) {
    const parsedRevisions = batchAsyncIterator(parseNdjsonLines<RevisionCreateInput>(req), 10)
    for await (let revisions of parsedRevisions) {
      await ingestRevisions(prisma, revisions)
    }
    return res.send({ ok: true })
  }
  throw new ServerError(400, 'Invalid content-type header.')
})

export default router

export function sendNdJson (res: express.Response, data: any[]): express.Response {
  const body = data.map(r => JSON.stringify(r)).join('\n') + '\n'
  return res
    .header('content-type', 'application/x-ndjson')
    .send(body)
}
