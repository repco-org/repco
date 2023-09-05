import casual from 'casual-browserify'
import prettyMs from 'pretty-ms'
import { SingleBar } from 'cli-progress'
import { EntityForm, repoRegistry } from 'repco-core'
import { request } from '../client.js'
import { createCommand, createCommandGroup } from '../parse.js'

const round = (x: number) => Math.round(x * 100) / 100

export const authTest = createCommand({
  name: 'auth-test',
  help: 'Test authentication to repco server',
  options: {},
  async run() {
    try {
      const res = await request('/test')
      console.log('GET /test', res)
      const res2 = await request('/test', {
        method: 'POST',
        body: { foo: 'bar' },
      })
      console.log('GET /test', res2)
    } catch (err) {
      console.error('got error', err)
    }
  },
})

export const createContent = createCommand({
  name: 'create-content',
  help: 'Create dummy content',
  arguments: [{ name: 'repo', required: true, help: 'DID or name of repo' }],
  options: {
    count: {
      type: 'string',
      short: 'c',
      help: 'Number of items to create (default: 1000)',
    },
    batch: {
      type: 'string',
      short: 'b',
      help: 'Items per commit (default: 50)',
    },
  },
  async run(opts, args) {
    const repo = await repoRegistry.openWithDefaults(args.repo)
    let count, batch
    if (opts.count) count = parseInt(opts.count)
    if (!count || isNaN(count)) count = 1000
    if (opts.batch) batch = parseInt(opts.batch)
    if (!batch || isNaN(batch)) batch = 50
    console.log(
      `Creating ${count} content items in repo ${repo.name} (batch size ${batch})`,
    )
    const batches = count / batch
    const bar = new SingleBar({})
    const start = performance.now()
    bar.start(count, 0, { commits: 0 })
    try {
      for (let i = 0; i < batches; i++) {
        const items = Array(batch).fill(null).map(createItem)
        // await repo.saveBatch('me', items)
        bar.update(i * batch, { commits: i })
      }
      bar.update(count, { commits: batches - 1 })
    } finally {
      bar.stop()
    }
    const end = performance.now()
    const dur = end - start
    console.log(`Took: ${prettyMs(dur)} for ${count} items`)
    console.log(
      `${round(count / (dur / 1000))} items/s ${round(dur / count)} ms/item`,
    )
  },
})

function createItem() {
  const item: EntityForm = {
    type: 'ContentItem',
    content: {
      contentFormat: 'text/plain',
      title: casual.catch_phrase,
      content: casual.sentences(3),
      summary: '{}',
      originalLanguages: {},
      contentUrl: '',
    },
  }
  return item
}

export const commands = createCommandGroup({
  name: 'debug',
  help: 'Development helpers',
  commands: [createContent, authTest],
})
