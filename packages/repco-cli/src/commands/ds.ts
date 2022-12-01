import Table from 'cli-table3'
import pc from 'picocolors'
import { createCommand, createCommandGroup } from '../parse.js'
import { Ingester, Repo, defaultDataSourcePlugins as plugins } from 'repco-core'

export const listPlugins = createCommand({
  name: 'list-plugins',
  help: 'List datasource plugins',
  async run() {
    const head = ['Uid', 'Name'].map(pc.red)
    const data = plugins.all().map(plugin => plugin.definition).map(d => [d.uid, d.name])
    const table = new Table({ head })
    table.push(...data)
    console.log(table.toString())
  },
})

export const list = createCommand({
  name: 'list',
  help: 'Show configured datasources in a repo',
  options: {
    repo: { type: 'string', short: 'r', help: 'Repo name or DID' },
    json: { type: 'boolean', short: 'j', help: 'Output as JSON'}
  },
  async run(opts) {
    const repo = await Repo.openWithDefaults(opts.repo)
    await repo.dsr.hydrate(repo.prisma, plugins)
    const data = repo.dsr.all().map(ds => ({ ...ds.definition, config: ds.config }))
    if (opts.json) {
      console.log(JSON.stringify(data))
    } else {
      for (const row of data) {
        const data = []
        for (let [key, value] of Object.entries(row)) {
          if (key === 'config') value = JSON.stringify(value)
          data.push([key, value])
        }
        const max = data.reduce((sum, [k]) => Math.max(k.length, sum), 0)
        const table = new Table({
          wordWrap: true,
          wrapOnWordBoundary: false,
          colWidths: [max + 2, process.stdout.columns - 6 - max]
        })
        table.push(...data)
        console.log(table.toString())
      }
    }
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
    const instance = await repo.dsr.create(repo.prisma, plugins, args.plugin, config)
    const def = instance.definition
    console.log(`Created datasource ${def.uid} for plugin ${def.pluginUid}`)
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
  commands: [add, list, ingest, listPlugins],
})
