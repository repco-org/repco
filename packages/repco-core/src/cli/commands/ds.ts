import Table from 'cli-table'
import { createCommand, createCommandGroup } from '../parse.js'
import { plugins } from '../../datasources/defaults.js'
import { Ingester } from '../../ingest.js'
import { Repo } from '../../repo.js'

export const listPlugins = createCommand({
  name: 'list-plugins',
  help: 'List datasource plugins',
  async run() {
    const table = new Table({
      head: ['Name', 'Plugin UID'],
    })
    for (const plugin of plugins.all()) {
      table.push([plugin.definition.name, plugin.definition.uid])
    }
    console.log(table.toString())
  },
})

export const add = createCommand({
  name: 'add',
  help: 'Add a datasource',
  arguments: [
    { name: 'plugin', required: true, help: 'Datasource plugin URN' },
    { name: 'endpoint', required: true, help: 'Endpoint URL' },
  ],
  options: {
    repo: { type: 'string', short: 'r', help: 'Repo name or DID' },
  },
  async run(opts, args) {
    const repo = await Repo.openWithDefaults(opts.repo)
    const prisma = repo.prisma
    const config = { endpoint: args.endpoint }
    if (!plugins.has(args.plugin))
      throw new Error(`Datasource plugin \`${args.plugin}\` is not installed.`)
    const res = await prisma.dataSource.create({
      data: {
        uid: args.endpoint,
        pluginUid: args.plugin,
        config: config,
        cursor: '',
      },
    })
    console.log(`Created datasource ${res.uid} for plugin ${res.pluginUid}`)
  },
})

export const ingest = createCommand({
  name: 'ingest',
  help: 'Ingest content from datasources',
  arguments: [],
  options: {
    repo: { type: 'string', short: 'r', help: 'Repo name or DID' },
  },
  async run(opts, _args) {
    const repo = await Repo.openWithDefaults(opts.repo)
    const ingester = new Ingester(plugins, repo)
    await ingester.init()
    const result = await ingester.work()
    console.log('finished', result)
  },
})

export const command = createCommandGroup({
  name: 'ds',
  help: 'Manage datasources',
  commands: [add, ingest, listPlugins],
})
