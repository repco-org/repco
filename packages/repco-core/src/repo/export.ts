import { CarWriter } from '@ipld/car'
import { BlockWriter } from '@ipld/car/api.js'
import { CID } from 'multiformats/cid'
import { IpldBlockStore } from './blockstore.js'
import { CommitIpld, RevisionIpld, RootIpld } from '../repo.js'

export async function exportRepoToCar(
  blockstore: IpldBlockStore,
  head: CID,
  last?: CID,
) {
  const { writer, out } = CarWriter.create([head])
  writeRepoToCar(blockstore, writer, head, last)
  return out
}

async function writeRepoToCar(
  blockstore: IpldBlockStore,
  writer: BlockWriter,
  head: CID,
  last?: CID,
) {
  try {
    let cid: CID | null = head
    while (cid) {
      const root: RootIpld = await fetchAndPutParsed(blockstore, writer, cid)
      const commit: CommitIpld = await fetchAndPutParsed(
        blockstore,
        writer,
        root.commit,
      )
      for (const cid of commit.revisions) {
        const revision: RevisionIpld = await fetchAndPutParsed(
          blockstore,
          writer,
          cid,
        )
        await fetchAndPut(blockstore, writer, revision.contentCid)
      }
      if (!commit.parent) {
        cid = null
      } else if (last && last.equals(commit.parent)) {
        cid = null
      } else {
        cid = commit.parent
      }
    }
  } catch (err) {
    console.error('Failed to complete export: ' + (err as Error).message)
    // throw err
  } finally {
    await writer.close()
  }
}

async function fetchAndPut(
  blockstore: IpldBlockStore,
  writer: BlockWriter,
  cid: CID,
): Promise<Uint8Array> {
  const bytes = await blockstore.getBytes(cid)
  await writer.put({ cid, bytes })
  return bytes
}
async function fetchAndPutParsed<T>(
  blockstore: IpldBlockStore,
  writer: BlockWriter,
  cid: CID,
): Promise<T> {
  const bytes = await fetchAndPut(blockstore, writer, cid)
  const data = blockstore.parse(bytes)
  return data as T
}

// export async function exportRepo(repo: Repo, last?: CID) {
// const where: Prisma.CommitWhereInput = {
//   repoDid: repo.uid
// }
// if (from) {
//   const start = await repo.prisma.commit.findUnique({
//     where: { rootCid: from.toString() },
//     select: { timestamp: true }
//   })
//   if (!start) throw new Error(`Starting commit not found: ${from.toString()}`)
//   where.timestamp = { lt: start.timestamp }
// }
// const rootCids = await repo.prisma.commit.findMany({
//   where,
//   select: { rootCid: true },
//   orderBy: { timestamp: 'desc' }
// })

// const head = await repo.getHead()
// if (!head) throw new Error('Repo is empty')
