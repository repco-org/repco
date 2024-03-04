/* eslint-disable  @typescript-eslint/no-non-null-assertion */

import test from 'brittle'
import { setup } from './util/setup.js'
import { DataSource, repoRegistry } from '../lib.js'
import {
  BaseDataSource,
  DataSourceDefinition,
  FetchUpdatesResult,
  ingestUpdatesFromDataSource,
  ingestUpdatesFromDataSources,
  remapDataSource,
  SourceRecordForm,
} from '../src/datasource.js'
import { EntityForm, TypedEntityForm } from '../src/entity.js'
import { DataSourcePlugin, DataSourcePluginRegistry } from '../src/plugins.js'

const intoSourceRecord = (body: EntityForm): SourceRecordForm => ({
  body: JSON.stringify(body),
  sourceType: 'entity',
  sourceUri: 'test:foo',
  contentType: 'text/repco-entity',
})

const DS_UID = 'urn:repco:datasource:test'

// const fromSourceRecord = (record: SourceRecordForm) =>
//   JSON.parse(record.body) as EntityForm

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
  insertMissing = false
  resolveMissing = false

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
    const contentItem: TypedEntityForm<'ContentItem'> = {
      type: 'ContentItem',
      content: {
        title: 'TEST1',
        MediaAssets: [{ uri: 'urn:test:media:1' }],
        content: 'helloworld',
        contentFormat: 'text/plain',
        summary: '{}',
        contentUrl: '',
      },
      headers: { EntityUris: ['urn:test:content:1'] },
    }
    if (this.insertMissing) {
      contentItem.content.MediaAssets!.push({ uri: 'urn:test:media:fail' })
    }
    bodies.push(contentItem)
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
          headers: { EntityUris: ['urn:test:file:1'] },
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
            Files: [{ uri: 'urn:test:file:1' }],
            description: '{}',
          },
          headers: { EntityUris: ['urn:test:media:1'] },
        }),
      ]
    }
    if (this.resolveMissing && uid === 'urn:test:media:fail') {
      return [
        intoSourceRecord({
          type: 'MediaAsset',
          content: {
            title: 'MediaMissingResolved',
            mediaType: 'audio/mp3',
            Files: [{ uri: 'urn:test:file:1' }],
            description: '{}',
          },
          headers: { EntityUris: ['urn:test:media:fail'] },
        }),
      ]
    }
    throw new Error('Not found: ' + uid)
  }

  async mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]> {
    const form = JSON.parse(record.body) as EntityForm
    if (this.mapUppercase) {
      if (form.type === 'ContentItem') {
        form.content.title = form.content.title //.toUpperCase()
      }
    }
    return [form]
  }
}

test('datasource', async (assert) => {
  const prisma = await setup(assert)
  const repo = await repoRegistry.create(prisma, 'test')
  const plugins = new DataSourcePluginRegistry()
  plugins.register(new TestDataSourcePlugin())
  await repo.dsr.create(repo.prisma, plugins, 'ds:test', {}, repo.did)
  await ingestUpdatesFromDataSources(repo)
  const uri = 'urn:test:content:1'
  const entities = await prisma.contentItem.findMany({
    where: { Revision: { entityUris: { has: uri } } },
    include: {
      MediaAssets: {
        include: { Files: true },
      },
    },
  })
  assert.is(entities.length, 1)
  const entity = entities[0]
  assert.is(entity.MediaAssets.length, 1)
  assert.is(
    entity.MediaAssets[0].Files[0].contentUrl,
    'http://example.org/file1.mp3',
  )
})

test('remap', async (assert) => {
  const prisma = await setup(assert)
  const repo = await repoRegistry.create(prisma, 'test')

  const plugins = new DataSourcePluginRegistry()
  plugins.register(new TestDataSourcePlugin())
  await repo.dsr.create(repo.prisma, plugins, 'ds:test', {}, repo.did)

  await ingestUpdatesFromDataSources(repo)

  const head = await repo.getHead()
  let len = await prisma.revision.count()
  assert.is(len, 3)

  const datasource = repo.dsr.get(DS_UID)
  assert.is(!!datasource, true)

  await remapDataSource(repo, datasource!)
  const head2 = await repo.getHead()
  assert.is(head.toString(), head2.toString())

  len = await prisma.revision.count()
  assert.is(len, 3)

  // @ts-ignore
  datasource.mapUppercase = true

  await remapDataSource(repo, datasource!)
  const head3 = await repo.getHead()
  assert.is(head2.toString(), head3.toString())

  len = await prisma.revision.count()
  assert.not(len, 4)

  const entitiesAfter = await prisma.contentItem.findMany()
  assert.is(entitiesAfter.length, 1)
  assert.is(entitiesAfter[0].title, 'TEST1')
})

// TODO: This is not working with batching right now.
test.skip('failed fetches', async (assert) => {
  const prisma = await setup(assert)
  const repo = await repoRegistry.create(prisma, 'test')

  const plugins = new DataSourcePluginRegistry()
  plugins.register(new TestDataSourcePlugin())
  await repo.dsr.create(repo.prisma, plugins, 'ds:test', {}, repo.did)
  const datasource = repo.dsr.get(DS_UID)! as TestDataSource
  datasource.insertMissing = true

  {
    const res = await ingestUpdatesFromDataSource(repo, datasource)
    assert.is(res.count, 1)
    const revisions = await repo.prisma.revision.count()
    assert.is(revisions, 3)
    const entities = await repo.prisma.entity.count()
    assert.is(entities, 3)
    const fails = await repo.prisma.failedDatasourceFetches.findMany()
    assert.is(fails.length, 1)
    assert.is(fails[0].uri, 'urn:test:media:fail')
  }

  datasource.resolveMissing = true

  await remapDataSource(repo, datasource)

  {
    const revisions = await repo.prisma.revision.count()
    assert.is(revisions, 5)
    const entities = await repo.prisma.entity.count()
    assert.is(entities, 4)
  }

  {
    const res = await ingestUpdatesFromDataSource(repo, datasource)
    assert.is(res.count, 0)
    const revisions = await repo.prisma.revision.count()
    assert.is(revisions, 5)
    const entities = await repo.prisma.entity.count()
    assert.is(entities, 4)
  }
})
