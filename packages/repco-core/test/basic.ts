import test from 'brittle'
import { setup } from './util/setup.js'
import { EntityForm, Repo } from '../lib.js'

test('smoke', async (assert) => {
  const prisma = await setup(assert)
  const repo = await Repo.create(prisma, 'default')
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
  const revisions = await repo.fetchRevisionsWithContent()
  assert.is(revisions.length, 1)
  const revision = revisions[0]
  assert.is(typeof revision.revision.id, 'string')
  assert.is((revision.content as any).title, 'foo')
})

test.solo('update', async (assert) => {
  const prisma = await setup(assert)
  const repo = await Repo.create(prisma, 'default')
  const input: EntityForm = {
    type: 'ContentItem',
    entityUris: ['first'],
    content: {
      title: 'foo',
      contentFormat: 'boo',
      content: 'badoo',
      subtitle: 'asdf',
      summary: 'yoo',
    },
  }
  await repo.saveEntity('me', input)
  input.content.title = 'bar'
  const revisions = await repo.fetchRevisionsWithContent()
  console.log('revisions 1', revisions)
  console.log('contentItems 1', await repo.prisma.contentItem.findMany())
  await repo.saveEntity('me', input)
  const revisions2 = await repo.fetchRevisionsWithContent()
  console.log('revisions 2', revisions2)
  console.log('contentItems 2', await repo.prisma.contentItem.findMany())
  assert.is(true, true)

})
