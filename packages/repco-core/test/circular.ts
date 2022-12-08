import test from 'brittle'
import { setup } from './util/setup.js'
import { EntityForm, Repo } from '../lib.js'
import {
  BaseDataSource,
  DataSource,
  DataSourceDefinition,
  ingestUpdatesFromDataSources,
} from '../src/datasource.js'
import { EntityBatch } from '../src/entity.js'

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
          SameAs: { uri: 'urn:repco:concept:2' },
        },
        entityUris: ['urn:repco:concept:1'],
      },
      'urn:repco:concept:2': {
        type: 'Concept',
        content: {
          name: 'concept2',
          // SameAs: { uri: 'urn:repco:concept:1' },
        },
        entityUris: ['urn:repco:concept:2'],
      },
    }
  }

  async fetchUpdates(cursor: string | null): Promise<EntityBatch> {
    let res
    if (cursor === '1') {
      res = { cursor, entities: [] }
    } else {
      const nextCursor = '1'
      res = {
        cursor: nextCursor,
        entities: [this.DATA['urn:repco:concept:1']],
      }
    }
    return res
  }

  async fetchByUri(uid: string): Promise<EntityForm[] | null> {
    const res = [this.DATA[uid]].filter((x) => x)
    return res
  }
}

test('circular', async (assert) => {
  const prisma = await setup(assert)
  const repo = await Repo.create(prisma, 'test')
  const datasource = new TestDataSource()
  repo.registerDataSource(datasource)
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
