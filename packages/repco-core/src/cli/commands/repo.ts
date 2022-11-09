import Table from 'cli-table'
import fs from 'fs/promises'
import fmtBytes from 'pretty-bytes'
import fmtMs from 'pretty-ms'
// @ts-ignore
import speedometer from 'speedometer'
import { Presets, SingleBar } from 'cli-progress'
import { createReadStream } from 'fs'
import { CID } from 'multiformats/cid'
import { PrismaClient } from 'repco-prisma'
import { pipeline } from 'stream/promises'
import { createCommand, createCommandGroup } from '../parse.js'
import { ImportProgress } from '../../mod.js'
import { Repo } from '../../repo.js'
import { ExportProgress } from '../../repo/export.js'

// helpers
const print = (msg: string) => console.error(msg)
const round = (x: number) => Math.round(x * 100) / 100
const barPreset = Presets.shades_grey

export const create = createCommand({
  name: 'create',
  help: 'Create a repo',
  options: {},
  arguments: [
    { name: 'name', required: true, help: 'Local name for repo' },
  ] as const,
  async run(_opts, args) {
    const prisma = new PrismaClient()
    const repo = await Repo.create(prisma, args.name)
    print(`Created mirror repo with DID \`${repo.did}\``)
    print('The secret key for this repo is stored in the database.')
  },
})

export const join = createCommand({
  name: 'mirror',
  help: 'Mirror an existing repo',
  options: {
    gateway: {
      type: 'string',
      short: 'g',
      help: 'Primary gateway URL for this repo',
    },
  },
  arguments: [
    { name: 'name', required: true, help: 'Local name for the repo' },
    { name: 'did', required: true, help: 'DID (identity string) of the repo' },
  ] as const,
  async run(_opts, args) {
    const prisma = new PrismaClient()
    const repo = await Repo.create(prisma, args.name, args.did)
    print(`Created mirror repo with DID \`${repo.did}\``)
  },
})

export const carExport = createCommand({
  name: 'car-export',
  help: 'Export repo to CAR file',
  options: {
    from: {
      type: 'string',
      short: 'f',
      help: 'Commit CID to start at (for updates)',
    },
  },
  arguments: [
    { name: 'repo', required: true, help: 'DID or name of repo' },
    { name: 'file', required: true, help: 'File path to export the repo to' },
  ] as const,
  async run(opts, args) {
    const repo = await Repo.openWithDefaults(args.repo)
    let from
    if (opts.from) from = CID.parse(opts.from)
    const format =
      '{bar} | {percentage}% {value}/{total} commits {speed}/s | {blocks} blocks | {bytesFmt}'
    const bar = new SingleBar({ format }, barPreset)
    let last = undefined as ExportProgress | undefined
    const start = performance.now()
    const speed = speedometer()
    const repoStream = await repo.exportToCarReversed({
      tail: from,
      onProgress: (progress) => {
        if (!bar.getTotal()) {
          bar.start(progress.commitsTotal, 0, {
            blocks: 0,
            bytes: 0,
            bytesFmt: 0,
            speed: '',
          })
        }
        bar.update(progress.commits, {
          blocks: progress.blocks,
          bytes: progress.bytes,
          bytesFmt: fmtBytes(progress.bytes),
          speed: fmtBytes(speed(progress.deltaBytes)),
        })
        last = progress
      },
    })

    print(`Export from: ${repo.name} (${repo.did})`)
    print(`Export to:   ${args.file === '-' ? 'STDOUT' : args.file}`)
    if (opts.from) print(`Start at:   ${from}`)

    try {
      if (args.file !== '-') {
        await fs.writeFile(args.file, repoStream)
      } else {
        await pipeline(repoStream, process.stdout)
      }
    } finally {
      bar.stop()
    }

    print(`Export complete`)
    const dur = performance.now() - start
    if (last) {
      const { commits, blocks, bytes } = last
      const pbytes = fmtBytes(bytes)
      const pdur = fmtMs(dur)
      const blocksPerS = round(blocks / (dur / 1000))
      const msPerBlock = round(dur / blocks)
      // prettier-ignore
      print(`Took: ${pdur} for ${blocks} blocks in ${commits} commits (${pbytes})`)
      print(`Throughput: ${blocksPerS} blocks/s ${msPerBlock} ms/block`)
    }
  },
})

export const carImport = createCommand({
  name: 'car-import',
  help: 'Import a CAR file into a repo',
  arguments: [
    { name: 'repo', required: true, help: 'DID or name of repo' },
    { name: 'file', required: true, help: 'File path to export the repo to' },
  ] as const,
  async run(_opts, args) {
    const repo = await Repo.openWithDefaults(args.repo)
    print(`Import from: ${args.file === '-' ? 'STDIN' : args.file}`)
    print(`Import to:   Repo "${repo.name}" (${repo.did})`)
    let input: AsyncIterable<Uint8Array>
    let total = 0
    if (args.file === '-') {
      input = process.stdin
    } else {
      const stat = await fs.stat(args.file)
      if (!stat.isFile()) throw new Error(`Input is not a file: ${args.file}`)
      total = stat.size
      print(`Total size:  ${fmtBytes(total)}`)
      input = createReadStream(args.file)
    }
    // prettier-ignore
    const format = '{bar} | {percentage}% {speed} | {blocksSaved} saved {blocksSkipped} skipped'
    const speed = speedometer()
    const bar = new SingleBar({ format }, barPreset)
    const start = performance.now()
    bar.start(total, 0, {
      totalFmt: fmtBytes(total),
      blocks: 0,
      blocksSaved: 0,
      blocksSkipped: 0,
      valueFmt: 0,
      speed: 0,
    })
    let lastProgress = undefined as ImportProgress | undefined
    try {
      await repo.importFromCar(input, (progress) => {
        const bps = speed(progress.bytes - (lastProgress?.bytes || 0))
        bar.update(progress.bytes, {
          blocks: progress.blocks,
          blocksSkipped: progress.skipped.blocks,
          blocksSaved: progress.blocks - progress.skipped.blocks,
          valueFmt: fmtBytes(progress.bytes),
          speed: fmtBytes(bps) + '/s',
        })
        lastProgress = progress
      })
    } finally {
      bar.stop()
    }
    const dur = performance.now() - start
    print(`Import complete`)
    if (lastProgress) {
      const { blocks, skipped, commits } = lastProgress
      const blocksPerS = round(blocks / (dur / 1000))
      const msPerBlock = round(dur / blocks)
      print(`Took: ${fmtMs(dur)} for ${blocks} blocks (in ${commits} commits)`)
      print(`Throughput: ${blocksPerS} blocks/s ${msPerBlock} ms/block`)
      if (skipped) {
        // prettier-ignore
        print(`Skipped: ${skipped.blocks} blocks (in ${skipped.commits} commits)`)
      }
    }
  },
})

export const list = createCommand({
  name: 'list',
  help: 'List repos',
  async run() {
    const prisma = new PrismaClient()
    const repos = await Repo.list(prisma)
    const table = new Table({
      head: ['DID', 'Name', 'Revisions'],
    })
    for (const repo of repos) {
      const count = await prisma.revision.count({
        where: { repoDid: repo.did },
      })
      table.push([repo.did, repo.name || '', String(count)])
    }
    print(table.toString())
  },
})

export const info = createCommand({
  name: 'info',
  help: 'Info on a repo',
  arguments: [{ name: 'repo', required: true, help: 'DID or name of repo' }],
  async run(_opts, args) {
    const repo = await Repo.openWithDefaults(args.repo)
    const table = new Table()
    const revisionCount = await repo.prisma.revision.count({
      where: { repoDid: repo.did },
    })
    const commitCount = await repo.prisma.commit.count({
      where: { repoDid: repo.did },
    })
    table.push(['DID', repo.did])
    table.push(['Name', repo.name || ''])
    table.push(['Writable', JSON.stringify(repo.writeable)])
    table.push(['Head (commit)', ((await repo.getHead()) || '-').toString()])
    table.push(['Head (revision)', (await repo.getCursor()) || '-'])
    table.push(['Revisions', String(revisionCount)])
    table.push(['Commits', String(commitCount)])
    print(table.toString())
  },
})

export const logRevisions = createCommand({
  name: 'log-revisions',
  help: 'Print all revisions as JSON',
  options: {
    content: { short: 'c', type: 'boolean', help: 'Include content' },
  },
  arguments: [{ name: 'repo', required: true, help: 'DID or name of repo' }],
  async run(opts, args) {
    const repo = await Repo.openWithDefaults(args.repo)
    let stream
    if (opts.content) {
      stream = repo.createContentStream()
    } else {
      stream = repo.createRevisionStream()
    }
    for await (const row of stream) {
      print(JSON.stringify(row))
    }
  },
})

export const command = createCommandGroup({
  name: 'repo',
  help: 'Manage repco repositories',
  commands: [create, join, list, info, carImport, carExport, logRevisions],
})
