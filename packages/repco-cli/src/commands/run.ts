import exitHook from 'async-exit-hook'
import { log, UntilStopped } from 'repco-common'
import { defaultDataSourcePlugins, Ingester, Repo } from 'repco-core'
import { repoRegistry } from 'repco-core/dist/src/repo.js'
import { PrismaClient } from 'repco-prisma'
import { runServer } from 'repco-server'
import { createCommand } from '../parse.js'
import { startPostgres } from '../util/postgres.js'

const SYNC_INTERVAL = 1000 * 60
const DEFAULT_PORT = 8765

export const run = createCommand({
  name: 'run',
  help: 'run a repco node',
  options: {
    httpPort: { type: 'string', short: 'p', help: 'Port to listen on' },
    temp: { type: 'boolean' },
  },
  async run(opts) {
    const shutdown: Array<() => Promise<void>> = []
    log.debug('start')
    if (opts.temp) {
      log.warn(
        'Running in temp mode with inmemory PostgreSQL - all changes will be lost',
      )
      const db = await startPostgres({ temp: true })
      process.env.DATABASE_URL = db.databaseUrl
      console.log(`DATABASE_URL=${process.env.DATABASE_URL}`)
      shutdown.push(db.shutdown)
    }
    const prisma = new PrismaClient()
    const port =
      Number(opts.httpPort) ||
      Number(process.env.HTTP_PORT) ||
      Number(process.env.PORT) ||
      DEFAULT_PORT

    // start sync all repos
    const sync = syncAllRepos(prisma)
    shutdown.push(sync.shutdown)

    // start ingest
    const ingest = ingestAll(prisma)
    shutdown.push(ingest.shutdown)

    // start server
    const server = runServer(prisma, { port })
    shutdown.push(server.shutdown)

    exitHook(async (callback) => {
      log.debug('Exit, wait for tasks to finish...')
      try {
        await Promise.all(shutdown.map((asyncfn) => asyncfn()))
        log.debug('All tasks finished, now quit.')
        setTimeout(callback, 1)
      } catch (err) {
        log.error('Error during shutdown: ', err)
        process.exit(1)
      }
    })
  },
})

function ingestAll(prisma: PrismaClient) {
  const ingesters: Ingester[] = []
  const onRepo = async (repo: Repo) => {
    const ingester = new Ingester(defaultDataSourcePlugins, repo)
    ingesters.push(ingester)
    const queue = ingester.workLoop()
    let lastCursor
    for await (const outcome of queue) {
      if (outcome.didFail()) {
        log.error({
          error: outcome.error,
          message: `ingest ${outcome.uid} failed: ${outcome.error?.toString()}`,
        })
      } else {
        if (outcome.cursor != lastCursor) {
          lastCursor = outcome.cursor
          log.debug(`ingest ${outcome.uid}: now at ${outcome.cursor}`)
        }
      }
    }
  }
  const tasks = repoRegistry.mapAsync(prisma, onRepo)
  repoRegistry.on('create', onRepo)

  const shutdown = async () => {
    repoRegistry.removeListener('create', onRepo)
    ingesters.forEach((ingester) => ingester.stop())
    await tasks
  }

  return {
    shutdown,
  }
}

function syncAllRepos(prisma: PrismaClient) {
  const shutdownSignal = new UntilStopped()

  const tasks = repoRegistry.mapAsync(prisma, async (repo) => {
    if (repo.writeable) return
    try {
      while (!shutdownSignal.stopped) {
        await repo.pullFromGateways()
        await shutdownSignal.timeout(SYNC_INTERVAL)
      }
    } catch (err) {
      // TODO: What to do when sync failed?
      log.error(`Sync failed for repo ${repo.name}: ${err}`)
    }
  })

  const shutdown = async () => {
    shutdownSignal.stop()
    await tasks
  }

  return {
    shutdown,
  }
}
