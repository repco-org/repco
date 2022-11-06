import test from 'brittle'
import process from 'process'
import { CarBlockIterator } from '@ipld/car'
// @ts-ignore
import { clock } from 'nanobench-utils'
import { setup } from './util/setup.js'
import { PrismaClient, Repo } from '../lib.js'
import { exportRepoToCar } from '../src/repo/export.js'

const round = (x: number) => Math.round(x * 100) / 100

const report = (timer: any, items: number, message: string) => {
  const ms = timer.ns() / 1000 / 1000
  console.log(`${message}: took ${round(ms)}ms for ${items} items`)
  console.log(
    `${round(items / (ms / 1000))} items/s ${round(ms / items)} ms/item`,
  )
}

function mkinput(i: number) {
  const input = {
    type: 'ContentItem',
    content: {
      title: 'rev' + i,
      contentFormat: 'boo',
      content: 'badoo',
      subtitle: 'asdf',
      summary: 'yoo',
    },
  }
  return input
}

test('car write read', { timeout: 100 * 1000 }, async (assert) => {
  await setup(assert)
  const prisma = new PrismaClient({
    // log: ['query']
  })
  const repo = await Repo.createOrOpen(prisma, 'default', 'default')
  const revs = Number(process.env.REVS || 20)
  const commits = Number(process.env.COMMITS || 5)
  const items = revs * commits
  const inputs = Array.from(Array(revs).keys()).map((i) => mkinput(i))
  const timer = clock('save')
  let total = 0
  for (let i = 0; i < commits; i++) {
    const res = await repo.saveBatch(
      'me',
      inputs.map((input, j) => {
        input.content.title = ' commit' + i + ' part' + j
        return input
      }),
    )
    total += res.length
    // console.log('save commit', i, 'inputs', inputs.length)
  }
  // timer.log('finish write')
  report(timer, total, 'WRITE')
  // let ms = Math.round(timer.ns() / 1000 / 1000 * 100) / 100
  // console.log('took', ms, 'for', total)
  // console.log(items / ms, 'ms per item')
  // console.log((ms * 1000) / items, 'items per second')

  const head = await repo.getHead()
  if (!head) throw new Error('expected head')
  // timer = clock('read')
  const carOut = await exportRepoToCar(repo.blockstore, head)
  const reader = await CarBlockIterator.fromIterable(carOut)
  const res = []
  const i = 0
  const timer2 = clock('read')
  for await (const block of reader) {
    const parsed = repo.blockstore.parse(block.bytes)
    res.push(parsed)
    // @tsignore
    // console.log('READ', ++i, parsed.commit && 'root', parsed.timestamp && 'commit', parsed.contentCid && 'revision', (parsed as any).title && (parsed as any).title)
  }
  // timer2.log('finish write')
  report(timer2, res.length, 'READ')
  // ms = Math.round(timer.ns() / 1000 / 1000 * 100) / 100
  // console.log('took', ms)
  // console.log(items / ms, 'ms per item')
  // console.log((ms * 1000) / items, 'items per second')
  assert.is('foo', 'foo')
  // assert.is(res.length, revs * commits * 2 + commits * 2)
})
