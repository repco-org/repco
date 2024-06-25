import test from 'brittle'
import { PrismaClient, repoRegistry } from 'repco-core'
import { fetch } from 'undici'
import { startServer } from './util/start.js'

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
      contentUrl: 'url',
      removed: false,
      originalLanguages: {},
    },
  }
  await repo.saveEntity('me', input)
  return repo
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
