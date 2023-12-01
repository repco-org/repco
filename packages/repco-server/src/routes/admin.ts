import express from 'express'
import pc from 'picocolors'
import {
  defaultDataSourcePlugins as plugins,
  Ingester,
  remapDataSource,
  repoRegistry,
} from 'repco-core'
import { ServerError } from '../error.js'
import { getLocals } from '../lib.js'

export const router = express.Router()

const ADMIN_TOKEN = process.env.REPCO_ADMIN_TOKEN

// check auth
router.use((req, res, next) => {
  if (!ADMIN_TOKEN || ADMIN_TOKEN.length < 16) {
    res.locals.log.warn(
      'ADMIN_TOKEN is not set or too short (min 16 characters needed). Admin access disabled.',
    )
    return next(new ServerError(403, 'Unauthorized'))
  }

  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ServerError(403, 'Unauthorized'))
  }

  const token = authHeader.substring(7)
  if (token != ADMIN_TOKEN) {
    return next(new ServerError(403, 'Unauthorized'))
  }

  next()
})

router.get('/test', async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  res.send({ ok: true })
})

router.post('/test', async (req, res) => {
  const body = req.body
  console.log('received body', body)
  res.send({ ok: true })
})

// create repo
router.post('/repo', async (req, res, next) => {
  const body = req.body
  if (!body.name) {
    return next(
      new ServerError(
        400,
        'Bad request. Name of repo that should be created is missing.',
      ),
    )
  }
  try {
    const { prisma } = getLocals(res)
    const repo = await repoRegistry.create(prisma, body.name)
    console.log(`Created new repo "${repo.name}" and DID`)
    console.log(`   ${pc.yellow(repo.did)}`)
    res.header('content-type', 'application/json')
    res.send({ repo_did: repo.did })
  } catch (err) {
    throw new ServerError(500, `Failed to create repo ${body.name}: ` + err)
  }
})

// List repos
router.get('/repo', async (req, res) => {
  try {
    const { prisma } = getLocals(res)
    const repos = await repoRegistry.list(prisma)
    const repoList = []
    for (const repo of repos) {
      const count = await prisma.revision.count({
        where: { repoDid: repo.did },
      })
      repoList.push({
        did: repo.did,
        name: repo.name || '',
        count: String(count),
      })
    }
    res.send({ repoList: repoList })
  } catch (err) {
    throw new ServerError(500, `Failed to list repos` + err)
  }
})

// Print info on a repo
router.get('/repo/:repo', async (req, res) => {
  try {
    const { prisma } = getLocals(res)
    const repo = await repoRegistry.open(prisma, req.params.repo)
    const revisionCount = await repo.prisma.revision.count({
      where: { repoDid: repo.did },
    })
    const commitCount = await repo.prisma.commit.count({
      where: { repoDid: repo.did },
    })
    const info = {
      did: repo.did,
      name: repo.name || '',
      writeable: repo.writeable,
      headCommit: ((await repo.getHead()) || '-').toString(),
      headRevisions: (await repo.getCursor()) || '-',
      revisions: revisionCount,
      commits: commitCount,
    }
    res.send({ info })
  } catch (err) {
    throw new ServerError(
      500,
      `Failed to get information for repo ${req.params.repo}` + err,
    )
  }
})

// create datasource
router.post('/repo/:repo/ds', async (req, res) => {
  try {
    const { prisma } = getLocals(res)
    const repo = await repoRegistry.open(prisma, req.params.repo)
    const { pluginUid, config } = req.body
    const configObj = JSON.parse(config)
    // Add name of repo to config in order to create unique uids for datasources
    configObj.repo = repo.name
    const instance = await repo.addDataSource(pluginUid, configObj)
    const def = instance.definition
    res.header('content-type', 'application/json')
    res.send({ uid: def.uid, pluginUid: def.pluginUid })
  } catch (err) {
    throw new ServerError(
      500,
      `Failed to create datasource ${req.body.pluginUid} in repo ${req.params.repo}: ` +
        err,
    )
  }
})

// List datasources in a repo
router.get('/repo/:repo/ds', async (req, res) => {
  try {
    const { prisma } = getLocals(res)
    const repo = await repoRegistry.open(prisma, req.params.repo)
    await repo.dsr.hydrate(repo.prisma, plugins, repo.did)
    const data = repo.dsr
      .all()
      .map((ds) => ({ ...ds.definition, config: ds.config }))
    res.send({ data })
  } catch (err) {
    throw new ServerError(
      500,
      `Failed to list all datasources for repo ${req.params.repo}` + err,
    )
  }
})

// Ingest from a datasource
router.post('/repo/:repo/ds/ingest', async (req, res) => {
  try {
    const { prisma } = getLocals(res)
    const repo = await repoRegistry.open(prisma, req.params.repo)
    const ingester = new Ingester(plugins, repo)
    if (req.body.loop) {
      const queue = ingester.workLoop()
      const message = `Started the ingestion workloop for all datasources of repo ${req.params.repo}. \
See server logs for results of the ingestion process.`
      res.send({ result: message })
      for await (const result of queue) {
        console.log(result)
      }
    } else {
      if (!req.body.ds) {
        const result = await ingester.ingestAll()
        res.send({ result })
      } else {
        console.log('Ingesting datasource ' + req.body.ds)
        const result = await ingester.ingest(req.body.ds)
        res.send({ result })
      }
    }
  } catch (err) {
    throw new ServerError(
      500,
      `Failed to ingest from datasources for repo ${req.params.repo}` + err,
    )
  }
})

// Remap a datasource
router.get('/repo/:repo/ds/:dsuid', async (req, res) => {
  try {
    const { prisma } = getLocals(res)
    const repo = await repoRegistry.open(prisma, req.params.repo)
    await repo.dsr.hydrate(repo.prisma, plugins, repo.did)
    const ds = repo.dsr.get(req.params.dsuid)
    if (!ds) throw new ServerError(500, 'Datasource does not exist')
    const result = await remapDataSource(repo, ds)
    res.send({ result })
  } catch (err) {
    throw new ServerError(
      500,
      `Failed to remap datasource ${req.params.dsuid} for repo ${req.params.repo}` +
        err,
    )
  }
})
