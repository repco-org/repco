import { CarBlockIterator } from '@ipld/car'
import { Block } from '@ipld/car/api.js'
import { CID } from 'multiformats/cid.js'
import {
  CommitBundle,
  CommitIpld,
  commitIpld,
  RevisionIpld,
  revisionIpld,
  RootIpld,
  rootIpld,
} from 'repco-common/schema'
import { verifyRoot } from './auth.js'
import {
  BlockT,
  parseBytesWith,
  parseToIpld,
  validateCID,
} from './blockstore.js'
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

// Import into a repo from a CAR stream.
//
// The incoming binary stream has to be a valid [CARv1 stream][carv1]. It must only contain
// valid RLDM blocks and their content blocks. The order MUST be as follows:
// root, commit, revision, content, [revision, content, ].., root, commit, ...
//
// [carv1]: https://ipld.io/specs/transport/car/carv1
export async function importRepoFromCar(
  repo: Repo,
  stream: AsyncIterable<Uint8Array>,
  onProgress?: OnProgressCallback,
) {
  const reader = await CarBlockIterator.fromIterable(stream)
  const skipped = { commits: 0, blocks: 0, revisions: 0, bytes: 0 }
  for await (const { bundle, progress, blocks } of readCommitBundles(
    reader,
    repo.did,
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
  root?: { cid: CID; data: RootIpld }
  commit?: { cid: CID; data: CommitIpld }
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

// This function is a state machine over a CARv1 stream of RLDM blocks.
//
// It expects the CAR stream to start with a root block. It decodes the root and expects
// the next block to be the commit references in root.body. It then expects the revision
// and content blocks referenced in commit.body. After parsing and validating a full bundle
// (root, commit, revisions and content), it yields the bundle and expects either another
// root or the end of the stream.
async function* readCommitBundles(
  reader: CarBlockIterator,
  repoDid: string,
): AsyncGenerator<{
  bundle: CommitBundle
  progress: BlockCounter
  blocks: Block[]
}> {
  // initialize progress object for progress reporting
  const progress = {
    bytes: 0,
    blocks: 0,
    commits: 0,
    revisions: 0,
    skippedCommits: 0,
  }
  // expect a root block initially
  let state: State = State.Root
  // prepare our partial bundle that will be filled block-by-block
  let bundle: CommitBundlePartial = { revisions: [] }
  // prepare an object to parse revisions into
  let revision: { cid: CID; body: RevisionIpld } | undefined
  // this collects the blocks of the current bundle
  const blocks = []

  // iterate over the blocks in the reader
  for await (const block of reader) {
    await validateCID(block)
    progress.blocks += 1
    progress.bytes += blocklen(block)
    // what we expect and do depends on our state
    switch (state) {
      case State.Root:
        bundle = {
          revisions: [],
          root: {
            data: parseBytesWith(block.bytes, rootIpld),
            cid: block.cid,
          },
        }
        state = State.Commit
        break
      case State.Commit:
        if (!bundle.root) throw new Error('invalid state')
        progress.commits += 1
        bundle.commit = {
          data: parseBytesWith(block.bytes, commitIpld),
          cid: block.cid,
        }
        if (!bundle.root.data.body.equals(block.cid)) {
          throw new UnexpectedCidError(block.cid, bundle.root.data.body, state)
        }

        // Verify the authorization! This will throw if one of the following fails to validate:
        // * the root contains a signature header
        // * the signature is a valid signature by the commit's author (commit.header.Author)
        //   over the commit cid (root.body).
        // * the commit contains a Proof header that contains a UCAN capability which gives
        //   Author the capability to publish to repo.did
        await verifyRoot(bundle.root.data, bundle.commit.data, repoDid)

        if (bundle.commit.data.headers.Repo !== repoDid) {
          throw new Error('commit does not belong to repo')
        }
        state = State.Revision
        break
      case State.Revision:
        if (!bundle.commit) throw new Error('invalid state')
        if (!bundle.commit.data.body.find((x) => block.cid.equals(x[0]))) {
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

    // We arrived at the end of the bundle (we parsed all revisions of the current commit)
    if (
      state === State.Revision &&
      bundle.revisions.length === bundle.commit?.data.body.length
    ) {
      if (!bundle.root) throw new Error('missing root block')
      if (!bundle.commit) throw new Error('missing commit block')
      const realBundle: CommitBundle = {
        headers: {
          ...bundle.commit.data.headers,
          ...bundle.root.data.headers,
          RootCid: bundle.root.cid,
          Cid: bundle.commit.cid,
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
