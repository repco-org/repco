import test from 'brittle'
import { setup } from './util/setup.js'
import { DataSource, Repo } from '../lib.js'
import {
  BaseDataSource,
  DataSourceDefinition,
  FetchUpdatesResult,
  ingestUpdatesFromDataSources,
  SourceRecordForm,
} from '../src/datasource.js'
import { EntityForm } from '../src/entity.js'
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
    if (uid.startsWith('urn:test:')) return true
    return false
  }

  async fetchUpdates(cursor: string | null): Promise<FetchUpdatesResult> {
    if (cursor === '1') {
      return { cursor, records: [] }
    }
    const nextCursor = '1'
    const bodies: EntityForm[] = []
    bodies.push({
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
      records: bodies.map(intoSourceRecord),
    }
  }
  async fetchByUri(uid: string): Promise<SourceRecordForm[] | null> {
    if (uid === 'urn:test:file:1') {
      return [
        intoSourceRecord({
          type: 'File',
          content: {
            contentUrl: 'http://example.org/file1.mp3',
          },
          entityUris: ['urn:test:file:1'],
        }),
      ]
    }
    if (uid === 'urn:test:media:1') {
      return [
        intoSourceRecord({
          type: 'MediaAsset',
          content: {
            title: 'Media1',
            mediaType: 'audio/mp3',
            File: { uri: 'urn:test:file:1' },
          },
          entityUris: ['urn:test:media:1'],
        }),
      ]
    }
    return null
  }

  async mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]> {
    return [fromSourceRecord(record)]
  }
}

test('datasource', async (assert) => {
  const prisma = await setup(assert)
  const repo = await Repo.create(prisma, 'test')
  const plugins = new DataSourcePluginRegistry()
  plugins.register(new TestDataSourcePlugin())
  await repo.dsr.create(repo.prisma, plugins, 'ds:test', {})
  await ingestUpdatesFromDataSources(repo)
  const uri = 'urn:test:content:1'
  const entities = await prisma.contentItem.findMany({
    where: { Revision: { entityUris: { has: uri } } },
    include: {
      MediaAssets: {
        include: { File: true },
      },
    },
  })
  assert.is(entities.length, 1)
  const entity = entities[0]
  assert.is(entity.MediaAssets.length, 1)
  assert.is(
    entity.MediaAssets[0].File.contentUrl,
    'http://example.org/file1.mp3',
  )
})
