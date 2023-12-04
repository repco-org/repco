import Table from 'cli-table3'
import pc from 'picocolors'
import {
  defaultDataSourcePlugins as plugins,
  Ingester,
  repoRegistry,
} from 'repco-core'
import { request } from '../client.js'
import { createCommand, createCommandGroup } from '../parse.js'

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
  arguments: [{ name: 'repo', required: true, help: 'DID or name of repo' }],
  options: {
    json: { type: 'boolean', short: 'j', help: 'Output as JSON' },
  },
  async run(opts, args) {
    try {
      const res = (await request(`/repo/${args.repo}/ds`, {
        method: 'GET',
      })) as any
      const data: {
        config: any
        uid: string
        name: string
        pluginUid: string
      }[] = res.data
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
    } catch (err) {
      console.error('Error listing all repos', err)
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
    repo: {
      type: 'string',
      short: 'r',
      default: process.env.REPCO_REPO,
      help: 'Repo name or DID',
    },
  },
  async run(opts, args) {
    try {
      if (!opts.repo) {
        throw new Error(
          'Either --repo option or REPCO_REPO environment variable is required.',
        )
      }
      const res = (await request(`/repo/${opts.repo}/ds`, {
        method: 'POST',
        body: { pluginUid: args.plugin, config: args.config },
      })) as any
      console.log(
        `Created datasource ${res.uid} in repo ${opts.repo} for plugin ${res.pluginUid}`,
      )
    } catch (err) {
      console.error('Error adding datasource: ', err)
    }
  },
})

export const ingest = createCommand({
  name: 'ingest',
  help: 'Ingest content from datasources',
  arguments: [],
  options: {
    repo: {
      type: 'string',
      required: true,
      short: 'r',
      help: 'Repo name or DID',
    },
    ds: {
      type: 'string',
      required: false,
      short: 'd',
      help: 'Datasource UID (optional)',
    },
    loop: { type: 'boolean', short: 'l', help: 'Keep running in a loop' },
  },
  async run(opts, _args) {
    try {
      if (!opts.repo) {
        throw new Error('Repo name or did required with -r option.')
      }
      const res = (await request(`/repo/${opts.repo}/ds/ingest`, {
        method: 'POST',
        body: { ds: opts.ds, loop: opts.loop },
      })) as any
      console.log(res.result)
    } catch (err) {
      console.error('Error ingesting from datasource: ', err)
    }
  },
})

export const remap = createCommand({
  name: 'remap',
  help: 'Remap all content from a datasource',
  options: {
    repo: {
      type: 'string',
      short: 'r',
      required: true,
      help: 'Repo name or DID',
    },
  },
  arguments: [{ name: 'datasource', required: true, help: 'Datasource UID' }],
  async run(opts, args) {
    try {
      if (!opts.repo) {
        throw new Error('Repo name or did required with -r option.')
      }
      const res = (await request(`/repo/${opts.repo}/ds/${args.datasource}`, {
        method: 'GET',
      })) as any
      console.log(res.result)
    } catch (err) {
      console.error('Error remapping datasource:', err)
    }
  },
})

export const command = createCommandGroup({
  name: 'ds',
  help: 'Manage datasources',
  commands: [add, list, ingest, listPlugins, remap],
})
