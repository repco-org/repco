/* eslint-disable  @typescript-eslint/no-non-null-assertion */

import test from 'brittle'
import express from 'express'
import getPort from 'get-port'
import { setup } from './util/setup.js'
import { DataSource, repoRegistry } from '../lib.js'
import {
  BaseDataSource,
  DataSourceDefinition,
  FetchUpdatesResult,
  ingestUpdatesFromDataSources,
  SourceRecordForm,
} from '../src/datasource.js'
import { EntityForm } from '../src/entity.js'
import { DataSourcePlugin, DataSourcePluginRegistry } from '../src/plugins.js'

type Config = {
  subtitleHost: string
}

class TestDataSourcePlugin implements DataSourcePlugin {
  createInstance(config: any) {
    return new TestDataSource(config as Config)
  }
  get definition() {
    return {
      name: 'test',
      uid: 'ds:test',
    }
  }
}

class TestDataSource extends BaseDataSource implements DataSource {
  public subtitleConfig: Config
  get definition(): DataSourceDefinition {
    return {
      name: 'TestDataSource',
      uid: 'ds:test:1',
      pluginUid: 'ds:test',
    }
  }

  constructor(config: Config) {
    super()
    this.subtitleConfig = config
  }

  canFetchUri(uid: string): boolean {
    if (uid.startsWith('test:')) return true
    return false
  }

  async fetchUpdates(cursorString: string | null): Promise<FetchUpdatesResult> {
    const cursor = Number(cursorString)
    console.log('fetchUpdates', cursor)
    const records = []
    if (cursor == 0) {
      const media: EntityForm = {
        type: 'MediaAsset',
        headers: {
          EntityUris: ['media1'],
        },
        content: {
          title: 'media1',
          description: 'boo',
          mediaType: 'video',
        },
      }
      const record1 = {
        sourceUri: 'subtitle1',
        contentType: 'text',
        body: JSON.stringify(media),
        sourceType: 'entity',
      }
      records.push(record1)
      const url = this.subtitleConfig.subtitleHost + '/subtitle1.vtt'
      const entity: EntityForm = {
        type: 'Transcript',
        content: {
          text: '',
          subtitleUrl: url,
          author: 'asdf',
          engine: 'foo',
          license: 'bar',
          language: 'de',
          MediaAsset: {
            uri: 'media1',
          },
        },
      }
      const record2 = {
        sourceUri: 'subtitle1',
        contentType: 'text',
        body: JSON.stringify(entity),
        sourceType: 'entity',
      }
      records.push(record2)
    }

    return {
      cursor: '' + (cursor + 1),
      records,
    }
  }
  async fetchByUri(_uid: string): Promise<SourceRecordForm[] | null> {
    throw new Error('Failed to fetch')
  }

  async mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]> {
    const form = JSON.parse(record.body) as EntityForm
    return [form]
  }
}

test('subtitle fetch after ingest', async (assert) => {
  console.log('start')
  const subtitlePort = await getPort()
  const subtitleApp = express()
  const VTT = `WEBVTT
00:00:00.500 --> 00:00:02.000
The Web is always changing

00:00:02.500 --> 00:00:04.300
and the way we access it is changing`

  subtitleApp.get('/subtitle1.vtt', (_req, res) => {
    res.header('content-type', 'text/vtt')
    res.send(VTT)
  })
  const subtitleServer = subtitleApp.listen(subtitlePort)
  const subtitleHost = `http://localhost:${subtitlePort}`

  const prisma = await setup(assert)
  const repo = await repoRegistry.create(prisma, 'test')
  const plugins = new DataSourcePluginRegistry()
  plugins.register(new TestDataSourcePlugin())
  await repo.dsr.create(
    repo.prisma,
    plugins,
    'ds:test',
    { subtitleHost },
    repo.did,
  )
  await ingestUpdatesFromDataSources(repo)
  const uri = 'media1'
  const entities = await prisma.mediaAsset.findMany({
    where: { Revision: { entityUris: { has: uri } } },
    include: {
      Transcripts: true,
    },
  })
  assert.is(entities.length, 1)
  const media = entities[0]
  assert.is(media.Transcripts.length, 1)
  const transcript = media.Transcripts[0]
  const expectedText = [
    'The Web is always changing',
    'and the way we access it is changing',
  ].join('\n')
  assert.is(transcript.text, expectedText)
  subtitleServer.closeAllConnections()
  subtitleServer.close()
})
