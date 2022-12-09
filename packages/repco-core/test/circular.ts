import test from 'brittle'
import { setup } from './util/setup.js'
import { ConceptKind, EntityForm, Repo } from '../lib.js'
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
      uid: 'ds:test',
    }
  }
}

class TestDataSource extends BaseDataSource implements DataSource {
  get definition(): DataSourceDefinition {
    return {
      name: 'TestDataSource',
      uid: 'urn:repco:datasource:test',
      pluginUid: 'urn:repco:datasource:test',
    }
  }
  canFetchUri(uid: string): boolean {
    if (uid.startsWith('urn:repco:')) return true
    return false
  }

  get DATA(): Record<string, EntityForm> {
    return {
      'urn:repco:concept:1': {
        type: 'Concept',
        content: {
          name: 'concept1',
          kind: ConceptKind.CATEGORY,
          SameAs: { uri: 'urn:repco:concept:2' },
        },
        entityUris: ['urn:repco:concept:1'],
      },
      'urn:repco:concept:2': {
        type: 'Concept',
        content: {
          name: 'concept2',
          kind: ConceptKind.CATEGORY,
          // SameAs: { uri: 'urn:repco:concept:1' },
        },
        entityUris: ['urn:repco:concept:2'],
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
        records: [this.DATA['urn:repco:concept:1']].map(intoSourceRecord),
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
  const repo = await Repo.create(prisma, 'test')
  const plugins = new DataSourcePluginRegistry()
  plugins.register(new TestDataSourcePlugin())
  await repo.dsr.create(repo.prisma, plugins, 'ds:test', {})
  await ingestUpdatesFromDataSources(repo)
  const entities = await prisma.concept.findMany()
  assert.is(entities.length, 2)
  // const datasource2 = new TestDataSource()
  // const dsr2 = new DataSourceRegistry()
  // dsr2.register(datasource2)
  // console.log('now ingest 2')
  // await ingestUpdatesFromDataSources(repo)
  // console.log('entities', entities)
})
