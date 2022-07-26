import { Prisma } from '@prisma/client'
import { Entity, Revision, fetchRevisions, ingestRevisions, createRevisionId, RevisionCreateInput } from 'repco-core'
import express from 'express'
import { getLocals } from '../routes.js'
import { ServerError } from '../error.js'

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

router.get('/ndjson', async (req, res) => {
  const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  res.header('content-type', HEADER_NDJSON)
  // res.send()
  res.flushHeaders()
  res.write(rows.map(row => JSON.stringify('a' + row)).join('\n') + '\n')
  await new Promise(resolve => setTimeout(resolve, 2000))
  res.write(rows.map(row => JSON.stringify('b' + row)).join('\n'))
  res.end()
})

router.put('/changes', async (req, res) => {
  const { prisma } = getLocals(res)
  try {
    if (req.header('content-type') === HEADER_JSON) {
      const revisions = req.body
      await ingestRevisions(prisma, revisions)
      return res.send({ ok: true })
    }
    if (req.header('content-type') === HEADER_NDJSON) {
      const parsedRevisions = batch(parseNdjson<RevisionCreateInput>(req), 10)
      for await (let revisions of parsedRevisions) {
        // revisions = revisions.map((r) => {
        //   r.revision.id = createRevisionId(Date.now())
        //   r.content.revisionId = r.revision.id
        //   return r
        // })
        await ingestRevisions(prisma, revisions)
      }
      return res.send({ ok: true })
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      throw new ServerError(500, err.message.replaceAll('\n', ''))
    } else {
      throw new ServerError(500, String(err))
    }
  }
})

async function * batch<T>(iter: AsyncIterable<T>, batchSize: number): AsyncIterable<T[]> {
  let batch = []
  for await (const line of iter) {
    batch.push(line)
    if (batch.length === batchSize) {
      yield batch
      batch = []
    }
  }
  if (batch.length) yield batch
}

async function * parseNdjson<T = any> (body: AsyncIterable<Uint8Array>): AsyncIterable<T> {
  let buf = ''
  for await (const chunk of body) {
    buf += new TextDecoder().decode(chunk)
    const parts = buf.split('\n')
    const last = parts.pop()
    if (last === undefined) continue
    if (last !== '') buf = last
    else buf = ''
    for (const line of parts) {
      yield JSON.parse(line) as T
    }
  }
  if (buf.length) yield JSON.parse(buf) as T
}

function sendNdJson (res: express.Response, data: any[]) {
  const body = data.map(r => JSON.stringify(r)).join('\n') + '\n'
  res
    .header('content-type', 'application/x-ndjson')
    .send(body)
}


export default router
