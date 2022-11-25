import { EntityForm, EntityWithRevision, filterType, Registry, TypedEntityWithRevision } from './mod.js'
import { form, Revision } from './prisma.js'

// TODO: this should be the output type
export type SourceRecord = form.SourceRecordInput

export type AfterFn = (src: TypedEntityWithRevision<'SourceRecord'>, dst: EntityForm[]) => void

export interface SourceRecordMapper {
  definition: { uid: string }

  canUpcastSourceRecord(record: SourceRecord): boolean
  upcastSourceRecord(
    record: SourceRecord,
    revision: Revision,
  ): Promise<EntityForm[]>
}

export class MapperRegistry extends Registry<SourceRecordMapper> {
  async apply(entity: SourceRecord, revision: Revision): Promise<EntityForm[]> {
    const mappers = this.filtered((x) => x.canUpcastSourceRecord(entity))
    for (const mapper of mappers) {
      const res = await mapper.upcastSourceRecord(entity, revision)
      if (res.length) return res
    }
    return []
  }

  async applyAll(input: EntityWithRevision[], afterEach?: AfterFn): Promise<EntityForm[]> {
    const records = filterType(input, 'SourceRecord')
    const all = []
    for (const record of records) {
      const res = await this.apply(record.content, record.revision)
      if (afterEach) afterEach(record, res)
      all.push(...res)
    }
    return all
  }
}
