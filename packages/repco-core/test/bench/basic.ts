import test from 'brittle'
import fs from 'fs/promises'
// @ts-ignore
import bench from 'nanobench-utils/nanobench.js'
import { createReadStream } from 'fs'
import { temporaryFile } from 'tempy'
import { setup2 } from '../util/setup.js'
import { EntityForm, repoRegistry } from '../../lib.js'

const count = 500
const batchSizes = [100, 10, 1]
for (const batch of batchSizes) {
  const group = `${count} (batch ${batch})`
  test(group, async (assert) => {
    assert.plan(1)
    assert.timeout(1000 * 1000)
    const count = 500
    const [prisma1, prisma2] = await setup2(assert)
    const repo = await repoRegistry.create(prisma1, 'test', undefined, false)
    const group = `${count} (batch ${batch})`
    bench(`create ${group}`, async (b: any) => {
      const batches = count / batch
      b.start()
      for (let i = 0; i < batches; i++) {
        const items = Array(batch).fill(null).map(createItem)
        await repo.saveBatch(items)
      }
      b.end()
    })
    const carfile = temporaryFile({ name: 'test.car' })
    bench(`export ${group}`, async (b: any) => {
      b.start()
      const stream = await repo.exportToCarReversed()
      await fs.writeFile(carfile, stream)
      b.end()
    })
    const repo2 = await repoRegistry.create(
      prisma2,
      'test-clone',
      repo.did,
      false,
    )
    bench(`import ${group}`, async (b: any) => {
      b.start()
      const readStream = createReadStream(carfile)
      await repo2.importFromCar(readStream)
      b.end()
      assert.is(true, true)
    })
  })
}

function createItem(i: number) {
  const item: EntityForm = {
    type: 'ContentItem',
    content: {
      contentFormat: 'text/plain',
      title: 'Item #' + i,
      content: 'foobar' + i,
      summary: '{}',
      contentUrl: '',
    },
  }
  return item
}
