import Table from 'cli-table3'
import express from 'express'
import pc from 'picocolors'
import { repoRegistry } from 'repco-core'
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

// list repos
router.get('/repo', async (req, res) => {
  try {
    const { prisma } = getLocals(res)
    const repos = await repoRegistry.list(prisma)
    const table = new Table({
      head: ['DID', 'Name', 'Revisions'],
    })
    for (const repo of repos) {
      const count = await prisma.revision.count({
        where: { repoDid: repo.did },
      })
      table.push([repo.did, repo.name || '', String(count)])
    }
    res.send({ repo_table: table })
  } catch (err) {
    throw new ServerError(500, `Failed to list repos` + err)
  }
})

// info on a repo
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
    const config_obj = JSON.parse(config)
    // Add name of repo to config in order to create unique uids for datasources
    config_obj.repo = repo.name
    const instance = await repo.addDataSource(pluginUid, config_obj)
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

// modify datasource
router.put('/repo/:repodid/ds/:dsuid', async (req, res) => {
  const body = req.body
  console.log('received body', body)
  res.send({ ok: true })
})
// get datasource
router.get('/repo/:repodid/ds/:dsuid', async (req, res) => {
  const body = req.body
  console.log('received body', body)
  res.send({ ok: true })
})
// list datasources
router.get('/repo/:repodid/ds', async (req, res) => {
  const body = req.body
  console.log('received body', body)
  res.send({ ok: true })
})
