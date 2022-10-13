import * as dotenv from 'dotenv'
import {
  DataSourceRegistry,
  ingestUpdatesFromDataSources,
  saveCursor,
} from './datasource.js'
import { CbaDataSource } from './datasources/cba.js'
import { RssDataSource } from './datasources/rss.js'
import { PrismaClient } from './prisma.js'

const USAGE = `Usage: node example.js <COMMAND>

Commands:
  ingest         Fetch and persist updates from datasources
  log-revisions  Load and print all revisions from the local database
  store-cursor   Store a cursor for a datasource manually
`
dotenv.config()
dotenv.config({ path: '../../.env' })
main().catch(console.error)

async function main() {
  const [command] = process.argv.slice(2)
  const prisma = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
    ],
  })

  // prisma.$on('query', async (e: Prisma.QueryEvent) => {
  //   console.log(`${e.query} ${e.params}`)
  // })
  const dsr = new DataSourceRegistry()
  // dsr.register(new CbaDataSource())
  dsr.register(
    new RssDataSource({
      endpoint:
        'https://www.freie-radios.net/portal/podcast.php?rss&anzahl=3&start=20',
    }),
  )
  dsr.register(new CbaDataSource())
  if (command === 'ingest') {
    for (const ds of dsr.all()) {
      console.log(
        `Ingest updates from \`${ds.definition.uid}\` ("${ds.definition.name}")`,
      )
    }
    const allResults = await ingestUpdatesFromDataSources(prisma, dsr)
    for (const [uid, res] of Object.entries(allResults)) {
      console.log(
        `${uid}: Ingested ${res.count} new revisions. New cursor: ${res.cursor}`,
      )
    }
  } else if (command === 'log-content-items') {
    await loadAndlogAllContentItems(prisma)
  } else if (command === 'log-revisions') {
    await loadAndLogAllEntities(prisma)
  } else if (command === 'store-cursor') {
    const dsUid = process.argv[3]
    const ds = dsr.get(dsUid)
    if (!ds) throw new Error(`Datasource ${dsUid} not registered.`)
    const cursor = process.argv[4]
    if (!cursor) throw new Error('Cursor is required')
    console.log(
      `Storing cursor for datasource ${ds.definition.uid}: \`${cursor}\``,
    )
    await saveCursor(prisma, ds, cursor)
    console.log('ok')
  } else {
    console.log(USAGE)
    process.exit(1)
  }
}

async function loadAndLogAllEntities(prisma: PrismaClient) {
  const revisions = await prisma.revision.findMany({
    include: {
      ContentItem: true,
      ContentGrouping: true,
    },
  })
  console.log(JSON.stringify(revisions, null, 2))
}

async function loadAndlogAllContentItems(prisma: PrismaClient) {
  const Revision = {
    select: {
      id: true,
      created: true,
      alternativeIds: true,
    },
  }
  const entities = await prisma.contentItem.findMany({
    include: {
      MediaAssets: {
        include: {
          File: {
            include: {
              Revision,
            },
          },
          Revision,
        },
      },
      Revision,
    },
  })
  console.log(JSON.stringify(entities, null, 2))
}
