import { CarBlockIterator } from '@ipld/car'
import { Block } from '@ipld/car/api.js'
import { CID } from 'multiformats/cid.js'
import { verifyRoot } from './auth.js'
import {
  BlockT,
  parseBytesWith,
  parseToIpld,
  validateCID,
} from './blockstore.js'
import {
  CommitBundle,
  CommitIpld,
  commitIpld,
  RevisionIpld,
  revisionIpld,
  RootIpld,
  rootIpld,
} from './ipld.js'
import { Repo } from '../repo.js'

export type OnProgressCallback = (progress: ImportProgress) => void

export class UnexpectedCidError extends Error {
  constructor(
    public received: CID,
    public expected: CID | null,
    public kind: string,
  ) {
    super(`Wrong CID: Expected ${kind} ${expected}, but received ${received}`)
  }
}

export async function importRepoFromCar(
  repo: Repo,
  stream: AsyncIterable<Uint8Array>,
  onProgress?: OnProgressCallback,
) {
  const reader = await CarBlockIterator.fromIterable(stream)
  const skipped = { commits: 0, blocks: 0, revisions: 0, bytes: 0 }
  for await (const { bundle, progress, blocks } of readCommitBundles(
    reader,
    repo,
  )) {
    if (await repo.hasRoot(bundle.headers.Cid)) {
      updateCounter(skipped, bundle, blocks)
    } else {
      await repo.blockstore.putBytesBatch(blocks)
      await repo.saveFromIpld(bundle)
    }
    if (onProgress) onProgress({ ...progress, skipped })
  }
}

type CommitBundlePartial = {
  root?: { cid: CID; body: RootIpld }
  commit?: { cid: CID; body: CommitIpld }
  revisions: {
    revision: RevisionIpld
    revisionCid: CID
    content: any
    contentCid: CID
  }[]
}

enum State {
  Root = 'root',
  Commit = 'commit',
  Revision = 'revision',
  Content = 'content',
  Yield = 'yield',
  Never = 'never',
}

export type ImportProgress = BlockCounter & {
  skipped: BlockCounter
}

const blocklen = (block: BlockT) => block.bytes.length + block.cid.bytes.length

export type BlockCounter = {
  bytes: number
  blocks: number
  commits: number
  revisions: number
}

function updateCounter(
  counter: BlockCounter,
  bundle: CommitBundle,
  blocks: BlockT[],
) {
  counter.revisions += bundle.body.length
  counter.commits += 1
  counter.blocks += bundle.body.length * 2 + 2
  counter.bytes += blocks.reduce((sum, b) => sum + blocklen(b), 0)
}

async function* readCommitBundles(
  reader: CarBlockIterator,
  repo: Repo,
): AsyncGenerator<{
  bundle: CommitBundle
  progress: BlockCounter
  blocks: Block[]
}> {
  const progress = {
    bytes: 0,
    blocks: 0,
    commits: 0,
    revisions: 0,
    skippedCommits: 0,
  }
  let state: State = State.Root
  let bundle: CommitBundlePartial = { revisions: [] }
  let revision: { cid: CID; body: RevisionIpld } | undefined
  const blocks = []
  for await (const block of reader) {
    await validateCID(block)
    progress.blocks += 1
    progress.bytes += blocklen(block)
    switch (state) {
      case State.Root:
        bundle = {
          revisions: [],
          root: {
            body: parseBytesWith(block.bytes, rootIpld),
            cid: block.cid,
          },
        }
        state = State.Commit
        break
      case State.Commit:
        if (!bundle.root) throw new Error('invalid state')
        progress.commits += 1
        bundle.commit = {
          body: parseBytesWith(block.bytes, commitIpld),
          cid: block.cid,
        }
        if (!bundle.root.body.body.equals(block.cid)) {
          throw new UnexpectedCidError(block.cid, bundle.root.body.body, state)
        }
        await verifyRoot(bundle.root.body, bundle.commit.body, repo.did)
        if (bundle.commit.body.headers.Repo !== repo.did) {
          throw new Error('commit does not belong to repo')
        }
        state = State.Revision
        break
      case State.Revision:
        if (!bundle.commit) throw new Error('invalid state')
        if (!bundle.commit.body.body.find((x) => block.cid.equals(x[0]))) {
          throw new Error('revision is not in commit')
        }
        progress.revisions += 1
        revision = {
          body: parseBytesWith(block.bytes, revisionIpld),
          cid: block.cid,
        }
        state = State.Content
        break
      case State.Content:
        if (!revision) throw new Error('invalid state')
        if (!revision.body.body?.equals(block.cid)) {
          throw new UnexpectedCidError(
            block.cid,
            revision.body.body || null,
            state,
          )
        }
        bundle.revisions.push({
          revision: revision.body,
          revisionCid: revision.cid,
          content: parseToIpld(block.bytes),
          contentCid: block.cid,
        })
        revision = undefined
        state = State.Revision
        break
      default:
        throw new Error('invalid state')
    }
    blocks.push(block)
    if (
      state === State.Revision &&
      bundle.revisions.length === bundle.commit?.body.body.length
    ) {
      if (!bundle.root) throw new Error('missing root block')
      if (!bundle.commit) throw new Error('missing commit block')
      const realBundle: CommitBundle = {
        headers: {
          ...bundle.commit.body.headers,
          ...bundle.root.body.headers,
          Cid: bundle.root.cid,
          BodyCid: bundle.commit.cid,
        },
        body: bundle.revisions.map((revision) => ({
          headers: {
            ...revision.revision.headers,
            Cid: revision.revisionCid,
            BodyCid: revision.contentCid,
          },
          body: revision.content,
        })),
      }
      yield {
        bundle: realBundle,
        progress,
        blocks,
      }
      state = State.Root
    }
  }
}
