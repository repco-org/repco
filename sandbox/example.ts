import { CbaDataSource } from "./datasources/cba.js";
import { EntityBatch } from "./entity.js";

main().catch(console.error)

async function main () {
  const ds = new CbaDataSource()

  let iterations = 2
  let cursor = null
  while (--iterations >= 0) {
    // const cursor = await fetchCursor(ds.id)
    console.log('fetch updates for cursor', cursor)
    const result: EntityBatch = await ds.fetchUpdates(cursor)
    // await saveBatch(result.entities)
    // await saveCursor(ds.id, cursor)
    console.log('result', result)
    cursor = result.cursor
  }
  // console.log('cursor', cursor)
  // console.log('result', result)
  // const nextCursor = result.cursor
  // console.log('cursor', nextCursor)
  // const result = await ds.fetchUpdates(cursor)
  // console.log('result', result)
}
