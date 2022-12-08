import test from 'brittle'
import { setup } from './util/setup.js'
import { DataSource, EntityForm, Repo } from '../lib.js'
import { BaseDataSource, DataSourceDefinition } from '../src/datasource.js'
import {
  MapperRegistry,
  RelationFinder,
  SourceRecord,
  SourceRecordMapper,
} from '../src/mod.js'

test('datasource with source records', async (assert) => {
  const prisma = await setup(assert)
  const repo = await Repo.create(prisma, 'test')

  repo.registerDataSource(new TestDataSource())
  const mappers = new MapperRegistry()
  mappers.register(new TestDataSourceMapper())

  const cursor = await repo.getCursor()
  const links = [{ uri: 'urn:test:feed:foo' }, { uri: 'urn:test:feed:bar' }]

  const input = await RelationFinder.resolveLinks(repo, links)
  await repo.saveBatch('me', input)

  const updates = repo.createContentBatchStream({
    from: cursor,
    type: ['SourceRecord'],
  })
  for await (const batch of updates) {
    const res = await mappers.applyAll(batch, (source, records) => {
      records.forEach((record) => (record.derivedFromUid = source.uid))
    })
    await repo.saveBatch('me', res)
  }
  const revs = await repo.fetchRevisionsWithContent()
  assert.is(revs.length, 4)
  assert.is(revs.filter((x) => x.type === 'SourceRecord').length, 2)
  assert.is(revs.filter((x) => x.type === 'ContentItem').length, 2)
})

class TestDataSource extends BaseDataSource implements DataSource {
  get definition(): DataSourceDefinition {
    return {
      name: 'TestDataSource',
      uid: 'urn:repco:datasource:test',
      pluginUid: 'urn:repco:datasource:test',
    }
  }

  canFetchUri(uid: string): boolean {
    if (uid.startsWith('urn:test:')) return true
    return false
  }

  async fetchByUri(uid: string): Promise<EntityForm[] | null> {
    const parts = uid.split(':')
    if (parts[2] === 'feed') {
      return [
        {
          type: 'SourceRecord',
          content: {
            contentType: 'application/json',
            domainType: 'test:weird-format',
            body: JSON.stringify({
              myuri: uid,
              rando: Math.round(100 * Math.random()),
            }),
            meta: {},
          },
        },
      ]
    }
    return []
  }
}

class TestDataSourceMapper implements SourceRecordMapper {
  get definition() {
    return { uid: 'test' }
  }
  canUpcastSourceRecord(record: SourceRecord): boolean {
    return record.domainType === 'test:weird-format'
  }

  async upcastSourceRecord(record: SourceRecord): Promise<EntityForm[]> {
    const body = JSON.parse(record.body)
    return [
      {
        type: 'ContentItem',
        content: {
          title: 'RandoItem #' + body.rando,
          content: 'originally published on ' + body.myuri,
          contentFormat: 'text/plain',
        },
      },
    ]
  }
}
