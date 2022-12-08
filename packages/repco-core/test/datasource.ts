import test from 'brittle'
import { setup } from './util/setup.js'
import { DataSource, Repo } from '../lib.js'
import {
  BaseDataSource,
  DataSourceDefinition,
  FetchUpdatesResult,
  ingestUpdatesFromDataSources,
  remapDataSource,
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

const DS_UID = 'urn:repco:datasource:test'

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
  mapUppercase = false

  get definition(): DataSourceDefinition {
    return {
      name: 'TestDataSource',
      uid: DS_UID,
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
    const form = JSON.parse(record.body) as EntityForm
    if (this.mapUppercase) {
      if (form.type === 'ContentItem') {
        form.content.title = form.content.title.toUpperCase()
      }
    }
    return [form]
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

test('remap', async (assert) => {
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

  const head = await repo.getHead()
  console.log('HEAD after ingest', head)
  let len = await prisma.revision.count()
  console.log('revs after ingest', len)

  const datasource = repo.dsr.get(DS_UID)

  assert.is(!!datasource, true)

  await remapDataSource(repo, datasource!)
  const head2 = await repo.getHead()
  console.log('HEAD after remap without changes', head2)
  assert.is(head!.toString(), head2!.toString())

  len = await prisma.revision.count()
  console.log('revs after remap1', len)

  // @ts-ignore
  datasource.mapUppercase = true

  await remapDataSource(repo, datasource!)
  const head3 = await repo.getHead()
  console.log('HEAD after remap with changes', head3)
  assert.not(head2!.toString(), head3!.toString())

  len = await prisma.revision.count()
  console.log('revs after remap2', len)

  const entitiesAfter = await prisma.contentItem.findMany()
  console.log(entitiesAfter)
})
