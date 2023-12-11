import 'source-map-support/register.js'
import getPort from 'get-port'
import p from 'path'
import split2 from 'split2'
import { Test } from 'brittle'
import {
  ChildProcess,
  spawn as spawnProcess,
  SpawnOptions,
} from 'node:child_process'
import type { Prisma } from 'repco-prisma'
import type { Readable } from 'stream'
import { fileURLToPath } from 'url'
import { PrismaClient } from '../../lib.js'

const REPCO_ROOT = p.join(fileURLToPath(import.meta.url), '../../../../../..')
const dockerPids: number[] = []

type LogFn = (msg: string) => void
const defaultLogFn = (...args: any[]) =>
  console.log(
    '# ',
    ...args.map((x) => (typeof x === 'string' ? x.replace('\n', ' ') : x)),
  )

export async function setup(test: Test) {
  const { teardown, databaseUrl } = await setupDb(defaultLogFn)
  test.teardown(teardown, { order: 0 })
  process.env.DATABASE_URL = databaseUrl
  const log: Prisma.LogDefinition[] = []
  if (process.env.QUERY_LOG) log.push({ emit: 'event', level: 'query' })
  const prisma = new PrismaClient({
    log,
    datasources: {
      db: { url: databaseUrl },
    },
  })
  // @ts-ignore
  prisma.$on('query', async (e: any) => {
    if (process.env.QUERY_LOG) {
      test.comment(`QUERY: ${e.query} ${e.params}`)
    }
  })
  return prisma
}

export async function setup2(test: Test) {
  return [await setup(test), await setup(test)]
}

// Run a postgres container and import migrations.
export async function setupDb(log: LogFn = console.log) {
  const port = await getPort()
  const name = 'repco-test-' + port
  const env = [
    'POSTGRES_USER=test',
    'POSTGRES_PASSWORD=test',
    'POSTGRES_DB=repco',
  ]
  // mount the prisma migrations into the container, plus a script for initdb that runs
  // all migrations (in alphanumerical order)
  const volumes = [
    `${REPCO_ROOT}/packages/repco-prisma/prisma/migrations:/docker-entrypoint-initdb.d/migrations:ro`,
    `${REPCO_ROOT}/docker/import-migrations.sh:/docker-entrypoint-initdb.d/import-migrations.sh:ro`,
  ]
  // set options to improve postgres performance (reliablity is not important here)
  const config = ['fsync=off', 'full_page_writes=off']
  // spawn the container
  const container = spawn(
    'docker',
    [
      'run',
      '--rm',
      '--name',
      name,
      '-p',
      `127.0.0.1:${port}:5432`,
      '--tmpfs',
      '/var/lib/postgresql/data:rw',
      ...volumes.flatMap((x) => ['-v', x]),
      ...env.flatMap((x) => ['-e', x]),
      'postgres:latest',
      ...config.flatMap((x) => ['-c', x]),
    ],
    { log },
  )
  // store the PID for cleanup on exit
  if (container.child.pid) dockerPids.push(container.child.pid)
  // wait for the container to print a line that tells us that the server is listening
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const ready = waitForLines(container.child.stderr!, [
    /database system is ready to accept connections/,
  ])
  // wait until the container dies or is ready to accept connections
  await Promise.race([container, ready])

  const databaseUrl = `postgresql://test:test@127.0.0.1:${port}/repco`
  const teardown = async () => {
    await spawn('docker', ['stop', '-t', '0', name])
  }
  return { teardown, databaseUrl }
}

// ensure all containers are killed on shutdown
process.on('exit', () => {
  for (const pid of dockerPids) {
    try {
      process.kill(pid)
    } catch (_err) {}
  }
})

async function waitForLines(stream: Readable, expected_lines: RegExp[]) {
  if (!expected_lines.length) return
  await new Promise<void>((resolve) => {
    let cur = expected_lines.shift()
    stream.pipe(split2()).on('data', (line: string) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (line.match(cur!)) {
        cur = expected_lines.shift()
        if (!cur) resolve()
      }
    })
  })
}

function spawn(
  command: string,
  args: string[],
  opts: SpawnOptions & { log?: Test['comment']; verbose?: boolean } = {},
): Promise<void> & { child: ChildProcess } {
  opts.verbose = opts.verbose || process.env.VERBOSE === '1' || false
  if (!opts.stdio) opts.stdio = 'pipe'
  const log = opts.log || ((msg: string) => console.error(`# ${msg}`))
  log(`spawn: ${command} ${args.map((x) => `${x}`).join(' ')}`)
  const child = spawnProcess(command, args, opts)
  let stderr = ''
  let stdout = ''
  child.stderr?.on('data', (data) => {
    if (opts.verbose) log(data.toString())
    else stderr += data
  })
  child.stdout?.on('data', (data) => {
    if (opts.verbose) log(data.toString())
    else stdout += data
  })
  const promise = new Promise((resolve, reject) => {
    child.on('error', (err) => reject(err))
    child.on('exit', (code) => {
      if (code) {
        const log = stdout + '\n' + stderr
        reject(
          new Error(
            `Command \`${command}\` exited with code ${code}. ${
              opts.verbose ? '' : `Command output:\n${log}`
            }`,
          ),
        )
      } else {
        resolve()
      }
    })
  }) as ReturnType<typeof spawn>
  promise.child = child
  return promise
}
