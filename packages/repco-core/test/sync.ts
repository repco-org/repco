import test from 'brittle'
import { setup2 } from './util/setup.js'
import { Repo } from '../lib.js'

test('simple sync', async (assert) => {
  const [prisma1, prisma2] = await setup2(assert)
  Repo.cache = false
  const repo1 = await Repo.create(prisma1, 'default')
  const repo2 = await Repo.create(prisma2, 'synced', repo1.did)
  assert.is(repo1.did, repo2.did)
  assert.is(repo1.writeable, true)
  assert.is(repo2.writeable, false)
  const input = {
    type: 'ContentItem',
    content: {
      title: 'foo',
      content: 'hello',
      contentFormat: 'text/plain',
    },
  }
  await repo1.saveEntity('me', input)
  input.content.title = 'bar'
  await repo1.saveEntity('me', input)

  const revisions1 = await repo1.fetchRevisionsWithContent()
  assert.is(revisions1.length, 2)
  assert.alike(
    revisions1.map((r) => (r.content as any).title),
    ['foo', 'bar'],
  )
  const stream = await repo1.exportToCarReversed()
  await repo2.importFromCar(stream)
  const revisions2 = await repo2.fetchRevisionsWithContent()
  assert.alike(revisions1, revisions2)
  input.content.title = 'baz'
  await repo1.saveEntity('me', input)
  const oldHead = await repo2.getHead()
  const stream2 = await repo1.exportToCarReversed({ tail: oldHead })
  await repo2.importFromCar(stream2)
  const revisions2b = await repo2.fetchRevisionsWithContent()
  assert.alike(
    revisions2b.map((r) => (r.content as any).title),
    ['foo', 'bar', 'baz'],
  )
})
