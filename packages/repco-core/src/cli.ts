import { CbaDataSource } from "./datasources/cba.js";
import { PrismaClient } from "./prisma.js"
import * as dotenv from "dotenv"
import { ingestUpdatesFromDataSource, saveCursor } from "./datasource.js";

const USAGE = `Usage: node example.js <COMMAND>

Commands:
  ingest         Fetch and persist updates from datasources
  log-revisions  Load and print all revisions from the local database
  store-cursor   Store a cursor for a datasource manually
`
dotenv.config()
dotenv.config({ path: '../../.env' })
main().catch(console.error)

async function main () {
  const [command] = process.argv.slice(2)
  const prisma = new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
    ],
  });

  prisma.$on("query", async (e) => {
      console.log(`${e.query} ${e.params}`)
  });
  const ds = new CbaDataSource()
  if (command === 'ingest') {
    console.log(`Ingest updates from \`${ds.definition.uid}\` ("${ds.definition.name}")`)
    const { count, cursor } = await ingestUpdatesFromDataSource(prisma, ds)
    console.log(`Ingested ${count} new revisions. New cursor: ${cursor}`)
  } else if (command === 'log-content-items') {
    await loadAndlogAllContentItems(prisma)
  } else if (command === 'log-revisions') {
    await loadAndLogAllEntities(prisma)
  } else if (command === 'store-cursor') {
    const cursor = process.argv[3]
    console.log(`Storing cursor for datasource ${ds.definition.uid}: \`${cursor}\``)
    await saveCursor(prisma, ds, cursor)
    console.log('ok')
  } else {
    console.log(USAGE)
    process.exit(1)
  }
}

async function loadAndLogAllEntities (prisma: PrismaClient) {
  const revisions = await prisma.revision.findMany({
    include: {
      contentItem: true,
      contentGrouping: true,
    }
  })
  console.log(JSON.stringify(revisions, null, 2))
}

async function loadAndlogAllContentItems(prisma: PrismaClient) {
  const revision =  {
    select: {
      id: true,
      created: true,
      alternativeIds: true
    }
  }
  const entities = await prisma.contentItem.findMany({
    include: {
      mediaAssets: {
        include: {
          file: {
            include: {
              revision
            }
          },
          revision
        },
      },
      revision
    }
  })
  // console.log(JSON.stringify(entities, null, 2))
}
