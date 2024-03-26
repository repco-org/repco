import test from 'brittle'
import { setup } from './util/setup.js'
import { EntityForm, repoRegistry } from '../lib.js'

test('smoke', async (assert) => {
  const prisma = await setup(assert)
  const repo = await repoRegistry.create(prisma, 'default')
  const input: EntityForm = {
    type: 'ContentItem',
    content: {
      title: { de: 'foo' },
      contentFormat: 'boo',
      content: { de: 'badoo' },
      subtitle: 'asdf',
      summary: { de: 'yoo' },
      contentUrl: 'url',
      originalLanguages: {},
    },
  }
  await repo.saveEntity(input)
  const revisions = await repo.fetchRevisionsWithContent()
  assert.is(revisions.length, 1)
  const revision = revisions[0]
  assert.is(typeof revision.revision.id, 'string')
  assert.alike((revision.content as any).title, { de: 'foo' })
})

test('update', async (assert) => {
  const prisma = await setup(assert)
  const repo = await repoRegistry.create(prisma, 'default')
  const input: EntityForm = {
    type: 'ContentItem',
    headers: { EntityUris: ['first'] },
    content: {
      title: { de: 'foo' },
      contentFormat: 'boo',
      content: { de: 'badoo' },
      subtitle: 'asdf',
      summary: { de: 'yoo' },
      contentUrl: 'url',
      originalLanguages: {},
    },
  }
  await repo.saveEntity(input)
  input.content.title = { de: 'bar' }
  const revisions = await repo.fetchRevisionsWithContent()
  console.log('revisions 1', revisions)
  console.log('contentItems 1', await repo.prisma.contentItem.findMany())
  await repo.saveEntity(input)
  const revisions2 = await repo.fetchRevisionsWithContent()
  console.log('revisions 2', revisions2)
  console.log('contentItems 2', await repo.prisma.contentItem.findMany())
  assert.is(true, true)
})
