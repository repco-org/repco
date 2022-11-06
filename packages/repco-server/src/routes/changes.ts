import express from 'express'
import type { Request } from 'express'
import { ContentLoaderStream, Repo } from 'repco-core'
import { ServerError } from '../error.js'
import { getLocals } from '../lib.js'

const router = express.Router()

const HEADER_JSON = 'application/json'
const HEADER_NDJSON = 'application/x-ndjson'

type RequestT = Request<any, any, any, any, Record<string, any>>

router.get('/', async (req, res) => {})

router.get('/changes/:repoDid', async (req, res) => {
  const { prisma } = getLocals(res)
  const { repoDid } = req.params
  const repo = await Repo.open(prisma, repoDid)
  const from = req.query.from?.toString()
  const revisionStream = repo.createRevisionBatchStream(from || '0', {})
  const content = req.query.content?.toString()
  let stream: AsyncIterable<any>
  if (content) {
    stream = ContentLoaderStream(revisionStream)
  } else {
    stream = revisionStream
  }
  stream = flattenStream(stream)
  if (acceptNdJson(req)) {
    await sendNdJsonStream(res, stream)
  } else {
    const rows = await collectStream(stream)
    res.json(rows)
  }
})

router.put('/changes', async (req, res) => {
  // const { prisma } = getLocals(res)
  // if (req.header('content-type') === HEADER_JSON) {
  //   const revisions = req.body
  //   // await ingestRevisions(prisma, revisions)
  //   return res.send({ ok: true })
  // }
  // if (req.header('content-type') === HEADER_NDJSON) {
  //   const parsedRevisions = batchAsyncIterator(
  //     parseNdjsonLines<RevisionCreateInput>(req),
  //     10,
  //   )
  //   for await (const revisions of parsedRevisions) {
  //     await ingestRevisions(prisma, revisions)
  //   }
  //   return res.send({ ok: true })
  // }
  throw new ServerError(400, 'Invalid content-type header.')
})

export default router

export function sendNdJson(
  res: express.Response,
  data: any[],
): express.Response {
  const body = data.map((r) => JSON.stringify(r)).join('\n') + '\n'
  return res.header('content-type', 'application/x-ndjson').send(body)
}

export async function sendNdJsonStream<S extends AsyncIterable<any>>(
  res: express.Response,
  stream: S,
): Promise<void> {
  res.header('content-type', 'application/x-ndjson')
  for await (const row of stream) {
    const line = JSON.stringify(row) + '\n'
    res.write(line)
  }
  res.end()
}

export async function* flattenStream(stream: AsyncIterable<any>) {
  for await (const chunk of stream) {
    if (Array.isArray(chunk)) {
      for (const row of chunk) {
        yield row
      }
    } else {
      yield chunk
    }
  }
}

export async function collectStream(
  stream: AsyncIterable<any>,
): Promise<any[]> {
  const rows = []
  for await (const row of stream) {
    rows.push(row)
  }
  return rows
}

export function acceptNdJson(req: RequestT) {
  return (
    req.query.format?.toString() === 'ndjson' ||
    req.headers.accept === HEADER_NDJSON ||
    req.headers.accept === 'ndjson'
  )
}
