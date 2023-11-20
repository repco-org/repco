import test, { Test } from 'brittle'
import getPort from 'get-port'
import { PrismaClient, repoRegistry } from 'repco-core'
import { setup } from 'repco-core/dist/test/util/setup.js'
import { fetch } from 'undici'
import { runServer } from '../src/lib.js'

async function createTestRepo(prisma: PrismaClient) {
  const repo = await repoRegistry.create(prisma, 'default')
  const input = {
    type: 'ContentItem',
    content: {
      title: 'foo',
      contentFormat: 'boo',
      content: 'badoo',
      subtitle: 'asdf',
      summary: 'yoo',
    },
  }
  await repo.saveEntity('me', input)
  return repo
}

async function startServer(assert: Test) {
  const prisma = await setup(assert)
  const port = await getPort()
  const url = `http://localhost:${port}`
  const { shutdown, isReady } = runServer(prisma, port)
  assert.teardown(shutdown, { order: Infinity })
  await isReady
  return { url, prisma }
}

test('smoke', async (assert) => {
  const { url, prisma } = await startServer(assert)
  const repo = await createTestRepo(prisma)

  const query = `{
    contentItems {
      nodes {
        title
        content
        revision { repoDid }
      }
    }
  }`

  const res = await fetch(`${url}/graphql`, {
    headers: { 'content-type': 'application/json' },
    method: 'POST',
    body: JSON.stringify({ query }),
  }).then((r) => r.json())

  assert.alike(res, {
    data: {
      contentItems: {
        nodes: [
          {
            title: 'foo',
            content: 'badoo',
            revision: {
              repoDid: repo.did,
            },
          },
        ],
      },
    },
  })
})
