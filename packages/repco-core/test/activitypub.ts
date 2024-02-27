import test from 'brittle'
import { fileURLToPath } from 'node:url'
import { ActivityPub, setGlobalApInstance, PeertubeClient, mountActivityPub } from 'repco-activitypub'
import { assertFixture, mockFetch } from './util/fetch.js'
import { setup, setupPeertube } from './util/setup.js'
import { repoRegistry } from '../lib.js'
import { ingestUpdatesFromDataSources } from '../src/datasource.js'
import { ActivityPubDataSourcePlugin } from '../src/datasources/activitypub.js'
import { DataSourcePluginRegistry } from '../src/plugins.js'
import express from 'express'
import getPort from 'get-port'


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
  const { teardown, peertubeUrl } = await setupPeertube()
  console.log("PEERTUBE_URL: ", peertubeUrl)
  assert.teardown(teardown, { order: 0 })

  const pt = new PeertubeClient(peertubeUrl)
  await pt.login("root", "peertube")
  const channelId = await pt.createChannel("testchannel")
  await pt.uploadVideo(channelId, "testvideo")

  const apServerPort = await getPort()
  const apUrl = `http://host.docker.internal:${apServerPort}/ap`
  const ap = new ActivityPub(prisma, apUrl)
  const server = express()
  mountActivityPub(server, ap, { prefix: '/ap' })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(apServerPort, () => {
      console.log(`!!!!!!!!!!!!!!!!!!!!!!! activitypub server listening on ${apUrl}`)
      resolve(true);
    })
  })
  setGlobalApInstance(ap)

  const repo = await repoRegistry.create(prisma, 'test')
  const plugins = new DataSourcePluginRegistry()
  const activityPubPlugin = new ActivityPubDataSourcePlugin()
  plugins.register(activityPubPlugin)
  await repo.dsr.create(
    repo.prisma,
    plugins,
    activityPubPlugin.definition.uid,
    {
      user: 'testchannel',
      domain: peertubeUrl,
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
