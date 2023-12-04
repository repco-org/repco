import test from 'brittle'
import { fileURLToPath } from 'node:url'
import { assertFixture, mockFetch } from './util/fetch.js'
import { setup } from './util/setup.js'
import { Repo } from '../lib.js'
import { ingestUpdatesFromDataSources } from '../src/datasource.js'
import { ActivityPubDataSourcePlugin } from '../src/datasources/activitypub.js'
import { DataSourcePluginRegistry } from '../src/plugins.js'

// Path to fixtures. Resolves to repco-core/test/fixtures/datasource-activitypub/$name
const fixturePath = (name: string) =>
  fileURLToPath(
    new URL(
      `../../test/fixtures/datasource-activitypub/${name}`,
      import.meta.url,
    ),
  )

test('peertube datasource - basic1', async (assert) => {
  mockFetch(assert, fixturePath('basic1'))
  const prisma = await setup(assert)
  const repo = await Repo.create(prisma, 'test')
  const plugins = new DataSourcePluginRegistry()
  const activityPubPlugin = new ActivityPubDataSourcePlugin()
  plugins.register(activityPubPlugin)
  await repo.dsr.create(
    repo.prisma,
    plugins,
    activityPubPlugin.definition.uid,
    {
      // user: 'blender_channel',
      // domain: 'video.blender.org'
      user: 'cryptix_channel',
      // user: 'mirsal',
      domain: 'peertube.1312.media',
    },
  )
  await ingestUpdatesFromDataSources(repo)
  // TODO: Provide mocking capability to uids
  const entities = await prisma.contentItem.findMany({
    select: {
      // uid: true,
      title: true,
      content: true,
      pubDate: true,
      PrimaryGrouping: {
        select: {
          // uid: true,
          title: true,
          // uri: true,
        },
      },
      Concepts: {
        select: {
          // uid: true,
          name: true,
        },
      },
      MediaAssets: {
        select: {
          // uid: true,
          mediaType: true,
          title: true,
          Files: {
            select: {
              // uid: true,
              contentUrl: true,
            },
          },
        },
      },
    },
  })
  await assertFixture(assert, fixturePath('entities.json'), entities)
})
