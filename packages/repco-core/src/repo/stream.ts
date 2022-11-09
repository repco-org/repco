import { Prisma, Revision } from 'repco-prisma'
import { Readable } from 'streamx'
import { EntityWithRevision } from '../entity.js'
import type { Repo } from '../repo.js'

export type RevisionFilter = {
  from?: string
  type?: string[]
  limit?: number
}

export async function* ContentLoaderStream<
  B extends boolean,
  T extends B extends false ? Revision : Revision[],
  U extends B extends false ? EntityWithRevision : EntityWithRevision[]
>(input: RevisionStream<B, T>, inBatches: B): AsyncGenerator<U>
{
  for await (const chunk of input) {
    const batch = input.asBatch(chunk)
    const out = []
    for (const revision of batch) {
      const entity = await input.repo.resolveContent(revision)
      out.push(entity)
    }
    if (inBatches) yield out as U
    else {
      for (const chunk of out) yield chunk as U
    }
  }
}

export class RevisionStream<
  B extends boolean,
  T extends B extends false ? Revision : Revision[],
> extends Readable<T> {
  finished = false
  cursor = '0'

  constructor(
    public repo: Repo,
    public readonly batch: B,
    public filter: RevisionFilter = {},
  ) {
    super()
    if (filter.from) this.cursor = filter.from
  }

  asBatch(chunk: T): Revision[] {
    if (!this.batch) return [chunk as Revision]
    return chunk as Revision[]
  }

  async _read(cb: (err?: Error | null) => void) {
    try {
      const revisions = await this._fetchRevisions()

      if (!revisions.length) {
        // finished!
        this.finished = true
        this.push(null)
        cb(null)
        return
      }

      if (this.batch) {
        this.cursor = revisions[revisions.length - 1].id
        this.push(revisions as T)
      } else {
        for (const revision of revisions) {
          this.cursor = revision.id
          this.push(revision as T)
        }
      }
      cb(null)
    } catch (err) {
      cb(err as Error)
    }
  }

  async _fetchRevisions() {
    const where: Prisma.RevisionWhereInput = {
      repoDid: this.repo.did,
      id: { gt: this.cursor },
    }
    if (this.filter.type) {
      where.entityType = { in: this.filter.type }
    }
    const revisions = await this.repo.prisma.revision.findMany({
      orderBy: [{ id: 'asc' }],
      take: 10,
      where,
    })
    return revisions
  }
}
