import test from 'brittle'
import { setup } from './util/setup.js'
import { PrismaClient, storeEntity, EntityForm, fetchRevisions } from '../index.js'

test('smoke', async assert => {
  await setup(assert.teardown)
  const prisma = new PrismaClient()
  const input: EntityForm = {
    type: "ContentItem",
    content: {
      uid: 'urn:repco:foo:bar',
      title: 'foo',
      contentFormat: 'boo',
      content: 'badoo',
      licenseUid: null,
      primaryGroupingUid: null,
      subtitle: 'asdf',
      summary: 'yoo',
    }
  }
  await storeEntity(prisma, input)
  const revisions = await fetchRevisions(prisma, {})
  assert.is(revisions.length, 1)
  const revision = revisions[0]
  assert.is(revision.uid, input.content.uid)
  assert.is(typeof revision.id, 'string')
  assert.is((revision.content as any).title, 'foo')
})
