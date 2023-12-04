import test from 'brittle'
import { fileURLToPath } from 'node:url'
import { assertFixture, mockFetch } from './util/fetch.js'
import { setup } from './util/setup.js'
import { repoRegistry } from '../lib.js'
import { ingestUpdatesFromDataSources } from '../src/datasource.js'
import { CbaDataSourcePlugin } from '../src/datasources/cba.js'
import { DataSourcePluginRegistry } from '../src/plugins.js'

// Path to fixtures. Resolves to repco-core/test/fixtures/datasource-cba/$name
const fixturePath = (name: string) =>
  fileURLToPath(
    new URL(`../../test/fixtures/datasource-cba/${name}`, import.meta.url),
  )

test('cba datasource - basic1', async (assert) => {
  mockFetch(assert, fixturePath('basic1'))
  const prisma = await setup(assert)
  const repo = await repoRegistry.create(prisma, 'test')
  const plugins = new DataSourcePluginRegistry()
  const cbaPlugin = new CbaDataSourcePlugin()
  plugins.register(cbaPlugin)
  await repo.dsr.create(
    repo.prisma,
    plugins,
    cbaPlugin.definition.uid,
    {
      pageLimit: 2,
      apiKey: null,
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
      pubDate: true,
      PrimaryGrouping: {
        select: {
          // uid: true,
          title: true,
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
