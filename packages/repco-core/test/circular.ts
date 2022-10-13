import test from 'brittle'
import { setup } from './util/setup.js'
import { EntityForm, PrismaClient } from '../lib.js'
import {
  BaseDataSource,
  DataSource,
  DataSourceDefinition,
  DataSourceRegistry,
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
  canFetchUID(uid: string): boolean {
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
          SameAs: { uri: 'urn:repco:concept:1' },
        },
        entityUris: ['urn:repco:concept:1'],
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
    console.log('fetchUpdates', cursor, res)
    return res
  }

  async fetchByUID(uid: string): Promise<EntityForm[] | null> {
    const res = [this.DATA[uid]].filter((x) => x)
    console.log('fetchByUid', uid, res)
    return res
  }
}

test('circular', async (assert) => {
  await setup(assert)
  console.log('setup complete')
  const prisma = new PrismaClient()
  const datasource = new TestDataSource()
  const dsr = new DataSourceRegistry()
  dsr.register(datasource)
  console.log('now ingest')
  await ingestUpdatesFromDataSources(prisma, dsr)
  console.log('ingested')
  const entities = await prisma.concept.findMany()
  console.log('entities', entities)
})
