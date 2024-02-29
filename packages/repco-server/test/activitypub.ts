import test from 'brittle'
import { fileURLToPath } from 'node:url'
import {
  defaultDataSourcePlugins,
  ingestUpdatesFromDataSources,
  repoRegistry,
} from 'repco-core'
import { assertFixture, mockFetch } from 'repco-core/dist/test/util/fetch.js'
import { startServer } from './util/start.js'

// Path to fixtures. Resolves to repco-server/test/fixtures/datasource-activitypub/$name
const fixturePath = (name: string) =>
  fileURLToPath(
    new URL(
      `../../test/fixtures/datasource-activitypub/${name}`,
      import.meta.url,
    ),
  )

test.skip('peertube datasource - basic1', async (assert) => {
  const { prisma } = await startServer(assert, {
    hostOverride: 'host.docker.internal',
  })
  mockFetch(assert, fixturePath('basic1'))
  const repo = await repoRegistry.create(prisma, 'test')
  await repo.dsr.create(
    repo.prisma,
    defaultDataSourcePlugins,
    'repco:datasource:activitypub',
    {
      user: 'root_channel',
      domain: 'http://host.docker.internal:9000',
      repo: repo.name,
    },
    repo.did,
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
