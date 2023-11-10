import express from 'express'
import { CID } from 'multiformats/cid'
import {
  ContentLoaderStream,
  DagJSON,
  encodeHeader,
  entryIpld,
  HeadersIpld,
  HttpError,
  PrismaIpldBlockStore,
  repoRegistry,
  revisionIpld,
} from 'repco-core'
import { Readable } from 'stream'
import { router as adminRouter } from './admin.js'
import { ServerError } from '../error.js'
import { getLocals } from '../lib.js'
import {
  acceptNdJson,
  collectStream,
  flattenStream,
  sendNdJsonStream,
} from '../util.js'

const router = express.Router()

// const HEADER_JSON = 'application/json'
const HEADER_CAR = 'application/vnd.ipld.car'

router.use('/admin', adminRouter)

router.get('/repos', async (_req, res) => {
  res.json(await repoRegistry.list(getLocals(res).prisma))
})

router.get('/health', (_req, res) => {
  res.send({ ok: true })
})

router.head('/sync/:repoDid', async (req, res) => {
  const { prisma } = getLocals(res)
  const { repoDid } = req.params
  const repo = await repoRegistry.open(prisma, repoDid)
  const cid = await repo.getHead()
  res.header('x-repco-head', cid.toString())
  res.status(204)
  res.send()
})

router.get('/sync/:repoDid/:tail?', async (req, res) => {
  const { prisma } = getLocals(res)
  const { repoDid, tail: tailStr } = req.params
  const tail = tailStr ? CID.parse(tailStr) : undefined
  const repo = await repoRegistry.open(prisma, repoDid)
  const carStream = await repo.exportToCarReversed({ tail })
  const byteStream = Readable.from(carStream)
  res.header('content-type', HEADER_CAR)
  byteStream.pipe(res)
})

router.post('/sync/:repoDid', async (req, res) => {
  const { prisma } = getLocals(res)
  const { repoDid } = req.params
  const repo = await repoRegistry.open(prisma, repoDid)
  await repo.importFromCar(req)
  res.json({ ok: true })
})

router.get('/changes/:repoDid', async (req, res) => {
  const { prisma } = getLocals(res)
  const { repoDid } = req.params
  const repo = await repoRegistry.open(prisma, repoDid)
  const from = req.query.from?.toString()
  const revisionStream = repo.createRevisionBatchStream({ from })
  const content = req.query.content?.toString()
  let stream: AsyncIterable<any>
  if (content) {
    stream = ContentLoaderStream(revisionStream, true)
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

router.get('/entry/:cid', async (req, res) => {
  const { prisma } = getLocals(res)
  const { cid } = req.params
  const store = new PrismaIpldBlockStore(prisma)
  try {
    const block = await store.get(CID.parse(cid))
    const entry = entryIpld.parse(block)
    setEntryHeaders(res, entry.headers)
    res.header('content-type', 'application/vnd.ipld.dag-json')
    res.write(DagJSON.encode(entry.body))
    res.end()
  } catch (err) {
    throw new HttpError(404, 'Block not found: ' + err)
  }
})

router.get('/entity/:uid', async (req, res) => {
  const { prisma } = getLocals(res)
  const { uid } = req.params
  const entity = await prisma.entity.findUnique({
    where: { uid },
    include: { Revision: true },
  })
  if (!entity) throw new HttpError(404, 'Not found')
  const repo = await repoRegistry.open(prisma, entity.Revision.repoDid)
  const [revisionEntry, contentEntry] = await Promise.all([
    repo.ipld.blockstore.getParsed(
      CID.parse(entity.Revision.revisionCid),
      revisionIpld,
    ),
    repo.ipld.blockstore.get(CID.parse(entity.Revision.contentCid)),
  ] as const)
  setEntryHeaders(res, revisionEntry.headers)
  res.header('content-type', 'application/json')
  res.write(DagJSON.encode(contentEntry))
  res.end()
})

function setEntryHeaders(res: express.Response, headers: HeadersIpld) {
  for (const [name, values] of Object.entries(headers)) {
    res.setHeader('X-Repco-' + name, encodeHeader(values))
  }
}

router.put('/changes', async (_req, _res) => {
  throw new ServerError(404, 'Not found')
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
  // throw new ServerError(400, 'Invalid content-type header.')
})

router.use(notFoundHandler)

export default router
