import test from 'brittle'
import { setup } from './util/setup.js'
import { EntityForm, repoRegistry } from '../lib.js'
import {
  BaseDataSource,
  DataSource,
  DataSourceDefinition,
  FetchUpdatesResult,
  ingestUpdatesFromDataSources,
  SourceRecordForm,
} from '../src/datasource.js'
import { DataSourcePlugin, DataSourcePluginRegistry } from '../src/plugins.js'

const intoSourceRecord = (body: EntityForm): SourceRecordForm => ({
  body: JSON.stringify(body),
  sourceType: 'entity',
  sourceUri: 'test:foo',
  contentType: 'text/repco-entity',
})

const fromSourceRecord = (record: SourceRecordForm) =>
  JSON.parse(record.body) as EntityForm

class TestDataSourcePlugin implements DataSourcePlugin {
  createInstance(_config: any) {
    return new TestDataSource()
  }
  get definition() {
    return {
      name: 'test',
      uid: 'repco:datasource:test',
    }
  }
}

class TestDataSource extends BaseDataSource implements DataSource {
  get definition(): DataSourceDefinition {
    return {
      name: 'TestDataSource',
      uid: 'repco:repo:datasource:test',
      pluginUid: 'repco:datasource:test',
    }
  }
  canFetchUri(uid: string): boolean {
    if (uid.startsWith('repco:')) return true
    return false
  }

  get DATA(): Record<string, EntityForm> {
    return {
      'repco:concept:1': {
        type: 'Concept',
        content: {
          name: 'concept1',
          kind: 'CATEGORY',
          SameAs: { uri: 'urn:repco:concept:2' },
          description: '{}',
          summary: '{}',
        },
        headers: { EntityUris: ['repco:concept:1'] },
      },
      'repco:concept:2': {
        type: 'Concept',
        content: {
          name: 'concept2',
          kind: 'CATEGORY',
          // SameAs: { uri: 'urn:repco:concept:1' },
          description: '{}',
          summary: '{}',
        },
        headers: { EntityUris: ['repco:concept:2'] },
      },
    }
  }

  async fetchUpdates(cursor: string | null): Promise<FetchUpdatesResult> {
    let res
    if (cursor === '1') {
      res = { cursor, records: [] }
    } else {
      const nextCursor = '1'
      res = {
        cursor: nextCursor,
        records: [this.DATA['repco:concept:1']].map(intoSourceRecord),
      }
    }
    return res
  }

  async fetchByUri(uid: string): Promise<SourceRecordForm[] | null> {
    const res = [this.DATA[uid]].filter((x) => x).map(intoSourceRecord)
    return res
  }

  async mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]> {
    return [fromSourceRecord(record)]
  }
}

test('circular', async (assert) => {
  const prisma = await setup(assert)
  const repo = await repoRegistry.create(prisma, 'test')
  const plugins = new DataSourcePluginRegistry()
  plugins.register(new TestDataSourcePlugin())
  await repo.dsr.create(
    repo.prisma,
    plugins,
    'repco:datasource:test',
    {},
    repo.did,
  )
  await ingestUpdatesFromDataSources(repo)
  const entities = await prisma.concept.findMany()
  assert.is(entities.length, 1)
  // const datasource2 = new TestDataSource()
  // const dsr2 = new DataSourceRegistry()
  // dsr2.register(datasource2)
  // console.log('now ingest 2')
  // await ingestUpdatesFromDataSources(repo)
  // console.log('entities', entities)
})
