import test from 'brittle'
import { setup } from './util/setup.js'
import { DataSource, EntityForm, PrismaClient } from '../index.js'
import {
  BaseDataSource,
  DataSourceDefinition,
  DataSources,
  ingestUpdatesFromDataSources,
} from '../src/datasource.js'
import { EntityBatch } from '../src/entity.js'

class TestDataSource extends BaseDataSource implements DataSource {
  get definition(): DataSourceDefinition {
    return {
      name: 'TestDataSource',
      uid: 'repco:datasource:test',
    }
  }

  canFetchUID(uid: string): boolean {
    if (uid.startsWith('test:')) return true
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
        uid: 'test:content:1',
        title: 'Test1',
        mediaAssets: ['test:media:1'],
        content: 'helloworld',
        contentFormat: 'text/plain',
      },
    })
    return {
      cursor: nextCursor,
      entities,
    }
  }
  async fetchByUID(uid: string): Promise<EntityForm[] | null> {
    if (uid === 'test:file:1') {
      return [
        {
          type: 'File',
          content: {
            uid: 'test:file:1',
            contentUrl: 'http://example.org/file1.mp3',
          },
        },
      ]
    }
    if (uid === 'test:media:1') {
      return [
        {
          type: 'MediaAsset',
          content: {
            uid: 'test:media:1',
            title: 'Media1',
            mediaType: 'audio/mp3',
            file: 'test:file:1',
          },
        },
      ]
    }
    return null
  }
}

test('datasource', async (assert) => {
  await setup(assert.teardown)
  const prisma = new PrismaClient()
  const datasource = new TestDataSource()
  const dsr = new DataSources()
  dsr.register(datasource)
  await ingestUpdatesFromDataSources(prisma, dsr)
  const entities = await prisma.contentItem.findMany({
    where: {
      uid: 'test:content:1',
    },
    include: {
      mediaAssets: {
        include: { file: true },
      },
    },
  })
  assert.is(entities.length, 1)
  const entity = entities[0]
  assert.is(entity.uid, 'test:content:1')
  assert.is(entity.mediaAssets.length, 1)
  assert.is(entity.mediaAssets[0].uid, 'test:media:1'),
    assert.is(entity.mediaAssets[0].file.uid, 'test:file:1')
  assert.is(
    entity.mediaAssets[0].file.contentUrl,
    'http://example.org/file1.mp3',
  )
})
