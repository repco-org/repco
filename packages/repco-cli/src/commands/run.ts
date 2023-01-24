import { UntilStopped } from 'repco-common'
import { defaultDataSourcePlugins, Ingester, Repo } from 'repco-core'
import { PrismaClient } from 'repco-prisma'
import { createCommand } from '../parse.js'

const SYNC_INTERVAL = 1000 * 60

export const run = createCommand({
  name: 'run',
  help: 'run a repco node',
  options: {
    httpPort: { type: 'string', short: 'p', help: 'Port to listen on' },
  },
  async run(opts) {
    const prisma = new PrismaClient()
    const port = Number(opts.httpPort) || Number(process.env.HTTP_PORT) || 8765

    // start server
    const { runServer } = await import('repco-server')
    const server = runServer(prisma, port)

    // start sync all repos
    const sync = syncAllRepos(prisma)

    // start ingest
    const ingest = ingestAll(prisma)

    // clean shutdown
    process.on('SIGINT', async () => {
      try {
        await Promise.all([
          server.shutdown(),
          sync.shutdown(),
          ingest.shutdown(),
        ])
        process.exit(0)
      } catch (err) {
        console.error('Error during shutdown: ', err)
        process.exit(1)
      }
    })
  },
})

function ingestAll(prisma: PrismaClient) {
  const ingesters: Ingester[] = []
  const tasks = Repo.mapAsync(prisma, async (repo) => {
    const ingester = new Ingester(defaultDataSourcePlugins, repo)
    ingesters.push(ingester)
    const queue = ingester.workLoop()
    for await (const result of queue) {
      console.log(result)
    }
  })

  const shutdown = async () => {
    ingesters.forEach((ingester) => ingester.stop())
    await tasks
  }

  return {
    shutdown,
  }
}

function syncAllRepos(prisma: PrismaClient) {
  const interval = SYNC_INTERVAL
  const untilStopped = new UntilStopped()

  const tasks = Repo.mapAsync(prisma, async (repo) => {
    try {
      while (!untilStopped.stopped) {
        await repo.pullFromGateways()
        await untilStopped.timeout(interval)
      }
    } catch (err) {
      // TODO: What to do when sync failed?
      console.error(`Sync failed for repo ${repo.name}: ${err}`)
    }
  })

  const shutdown = async () => {
    untilStopped.stop()
    await tasks
  }

  return {
    shutdown,
  }
}
