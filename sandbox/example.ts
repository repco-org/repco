import { CbaDataSource } from "./datasources/cba.js";
import { PrismaClient } from "./prisma.js"
import * as dotenv from "dotenv"
import { persistUpdatesFromDataSource  } from "./datasource.js";

const USAGE = `Usage: node example.js <COMMAND>

Commands:
  ingest         Fetch and persist updates from datasources
  log-revisions  Load and print all revisions from the local database`

dotenv.config()
main().catch(console.error)

async function main () {
  const [command] = process.argv.slice(2)
  const prisma = new PrismaClient()
  const ds = new CbaDataSource()
  if (command === 'ingest') {
    console.log(`Ingest updates from \`${ds.definition.uid}\` ("${ds.definition.name}")`)
    const { count, cursor } = await persistUpdatesFromDataSource(prisma, ds)
    console.log(`Ingested ${count} new revisions. New cursor: ${cursor}`)
  } else if (command === 'log-revisions') {
    await loadAndLogAllEntities(prisma)
  } else {
    console.log(USAGE)
    process.exit(1)
  }
}

async function loadAndLogAllEntities (prisma: PrismaClient) {
  const revisions = await prisma.revision.findMany({
    include: {
      contentItem: true,
      contentGrouping: true
    }
  })
  console.log(JSON.stringify(revisions, null, 2))
}
