import test from 'brittle'
import { setup } from './util/setup.js'
import { DataSource, EntityForm, PrismaClient } from '../lib.js'
import {
  BaseDataSource,
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
    if (uid.startsWith('urn:test:')) return true
    return false
  }

  async fetchUpdates(cursor: string | null): Promise<EntityBatch> {
    if (cursor === '1') {
      return { cursor, entities: [] }
    }
    const nextCursor = '1'
    const entities: EntityForm[] = []
    entities.push({
      type: 'ContentItem',
      content: {
        title: 'Test1',
        MediaAssets: [{ uri: 'urn:test:media:1' }],
        content: 'helloworld',
        contentFormat: 'text/plain',
      },
      entityUris: ['urn:test:content:1'],
    })
    return {
      cursor: nextCursor,
      entities,
    }
  }
  async fetchByUID(uid: string): Promise<EntityForm[] | null> {
    if (uid === 'urn:test:file:1') {
      return [
        {
          type: 'File',
          content: {
            contentUrl: 'http://example.org/file1.mp3',
          },
          entityUris: ['urn:test:file:1'],
        },
      ]
    }
    if (uid === 'urn:test:media:1') {
      return [
        {
          type: 'MediaAsset',
          content: {
            title: 'Media1',
            mediaType: 'audio/mp3',
            File: { uri: 'urn:test:file:1' },
          },
          entityUris: ['urn:test:media:1'],
        },
      ]
    }
    return null
  }
}

test('datasource', async (assert) => {
  await setup(assert)
  const prisma = new PrismaClient()
  const datasource = new TestDataSource()
  const dsr = new DataSourceRegistry()
  dsr.register(datasource)
  await ingestUpdatesFromDataSources(prisma, dsr)
  const entities = await prisma.contentItem.findMany({
    where: { uid: 'urn:test:content:1' },
    include: {
      MediaAssets: {
        include: { File: true },
      },
    },
  })
  assert.is(entities.length, 1)
  const entity = entities[0]
  assert.is(entity.uid, 'urn:test:content:1')
  assert.is(entity.MediaAssets.length, 1)
  assert.is(entity.MediaAssets[0].uid, 'urn:test:media:1'),
    assert.is(entity.MediaAssets[0].File.uid, 'urn:test:file:1')
  assert.is(
    entity.MediaAssets[0].File.contentUrl,
    'http://example.org/file1.mp3',
  )
})
