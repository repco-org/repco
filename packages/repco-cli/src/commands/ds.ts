import Table from 'cli-table3'
import pc from 'picocolors'
import {
  defaultDataSourcePlugins as plugins,
  Ingester,
  remapDataSource,
  Repo,
} from 'repco-core'
import { CliError, createCommand, createCommandGroup } from '../parse.js'

export const listPlugins = createCommand({
  name: 'list-plugins',
  help: 'List datasource plugins',
  async run() {
    const head = ['Uid', 'Name'].map(pc.red)
    const data = plugins
      .all()
      .map((plugin) => plugin.definition)
      .map((d) => [d.uid, d.name])
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
    json: { type: 'boolean', short: 'j', help: 'Output as JSON' },
  },
  async run(opts) {
    const repo = await Repo.openWithDefaults(opts.repo)
    await repo.dsr.hydrate(repo.prisma, plugins)
    const data = repo.dsr
      .all()
      .map((ds) => ({ ...ds.definition, config: ds.config }))
    if (opts.json) {
      console.log(JSON.stringify(data))
    } else {
      for (const row of data) {
        const data = []
        for (const [key, value] of Object.entries(row)) {
          let stringValue = value
          if (key === 'config') stringValue = JSON.stringify(value)
          data.push([key, stringValue])
        }
        const max = data.reduce((sum, [k]) => Math.max(k.length, sum), 0)
        const table = new Table({
          wordWrap: true,
          wrapOnWordBoundary: false,
          colWidths: [max + 2, process.stdout.columns - 6 - max],
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
    { name: 'config', required: true, help: 'Config (as json)' },
  ],
  options: {
    repo: { type: 'string', short: 'r', help: 'Repo name or DID' },
  },
  async run(opts, args) {
    const repo = await Repo.openWithDefaults(opts.repo)
    // const prisma = repo.prisma
    const config = JSON.parse(args.config)
    const instance = await repo.dsr.create(
      repo.prisma,
      plugins,
      args.plugin,
      config,
    )
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
    ds: {
      type: 'string',
      required: false,
      short: 'd',
      help: 'Datasource UID (optional)',
    },
    loop: { type: 'boolean', short: 'l', help: 'Keep running in a loop' },
  },
  async run(opts, _args) {
    const repo = await Repo.openWithDefaults(opts.repo)
    const ingester = new Ingester(plugins, repo)
    if (opts.loop) {
      const queue = ingester.workLoop()
      for await (const result of queue) {
        console.log(result)
      }
    } else {
      if (!opts.ds) {
        const result = await ingester.ingestAll()
        console.log(result)
      } else {
        console.log('Ingesting datasource ' + opts.ds)
        const result = await ingester.ingest(opts.ds)
        console.log(result)
      }
    }
  },
})

export const remap = createCommand({
  name: 'remap',
  help: 'Remap all content from a datasource',
  options: {
    repo: { type: 'string', short: 'r', help: 'Repo name or DID' },
  },
  arguments: [{ name: 'datasource', required: true, help: 'Datasource UID' }],
  async run(opts, args) {
    const repo = await Repo.openWithDefaults(opts.repo)
    await repo.dsr.hydrate(repo.prisma, plugins)
    const ds = repo.dsr.get(args.datasource)
    if (!ds) throw new CliError('Datasource does not exist')
    const result = await remapDataSource(repo, ds)
    console.log(result)
  },
})

export const command = createCommandGroup({
  name: 'ds',
  help: 'Manage datasources',
  commands: [add, list, ingest, listPlugins, remap],
})
