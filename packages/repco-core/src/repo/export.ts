import { CarWriter } from '@ipld/car'
import { BlockWriter } from '@ipld/car/api.js'
import { CID } from 'multiformats/cid'
import { Prisma } from 'repco-prisma'
import { IpldBlockStore } from './blockstore.js'
import { CommitIpld, Repo, RevisionIpld, RootIpld } from '../repo.js'

export async function exportRepoToCar(
  blockstore: IpldBlockStore,
  head: CID,
  tail?: CID,
) {
  const { writer, out } = CarWriter.create([head])
  writeRepoToCar(blockstore, writer, head, tail)
  return out
}

export async function exportRepoToCarReversed(
  repo: Repo,
  head: CID,
  tail?: CID,
) {
  const { writer, out } = CarWriter.create([tail || head])
  writeRepoToCarReversed(repo, writer, head, tail)
  return out
}

async function writeRepoToCarReversed(
  repo: Repo,
  writer: BlockWriter,
  head: CID,
  tail?: CID,
) {
  try {
    const headRow = await repo.prisma.commit.findFirst({
      where: { repoDid: repo.did, rootCid: head.toString() },
      select: { timestamp: true },
    })
    if (!headRow) throw new Error('Invalid head')
    const where: Prisma.CommitWhereInput[] = [
      { repoDid: repo.did, timestamp: { lte: headRow.timestamp } },
    ]

    if (tail) {
      const tailRow = await repo.prisma.commit.findFirst({
        where: { repoDid: repo.did, rootCid: tail.toString() },
        select: { timestamp: true },
      })
      if (!tailRow) throw new Error('Invalid tail')
      where.push({
        repoDid: repo.did,
        timestamp: { gt: tailRow.timestamp },
      })
    }
    const commitLog = await repo.prisma.commit.findMany({
      where: { AND: where },
      orderBy: { timestamp: 'asc' },
      select: { rootCid: true },
    })
    for (const commit of commitLog) {
      await writeCommitToCar(repo.blockstore, writer, CID.parse(commit.rootCid))
    }
  } catch (err) {
    // This runs in the background, streaming,
    // so there is currently nowhere to throw the error to.
    console.error('export failed', err)
  } finally {
    await writer.close()
  }
}

async function writeRepoToCar(
  blockstore: IpldBlockStore,
  writer: BlockWriter,
  head: CID,
  tail?: CID,
) {
  try {
    let cid: CID | null = head
    while (cid) {
      const commit: CommitIpld = await writeCommitToCar(blockstore, writer, cid)
      if (!commit.parent || (tail && tail.equals(commit.parent))) {
        cid = null
      } else {
        cid = commit.parent
      }
    }
  } catch (err) {
    // This runs in the background, streaming,
    // so there is currently nowhere to throw the error to.
    console.error('export failed', err)
  } finally {
    await writer.close()
  }
}

async function writeCommitToCar(
  blockstore: IpldBlockStore,
  writer: BlockWriter,
  cid: CID,
): Promise<CommitIpld> {
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
  return commit
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
