import test from 'brittle'
import { setup } from './util/setup.js'
import { Repo } from '../lib.js'

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
