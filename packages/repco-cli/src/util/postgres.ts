import getPort from 'get-port'
import p from 'node:path'
import {
  ChildProcess,
  spawn as spawnProcess,
  SpawnOptions,
} from 'node:child_process'
import type { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

const REPCO_ROOT = p.join(fileURLToPath(import.meta.url), '../../../..')

type LogFn = (msg: string) => void

const dockerPids: number[] = []

export type DbOpts = {
  log: LogFn
  port: number
  password: string
  temp?: boolean
  dataDir?: string
}

const defaultOpts = async (opts: Partial<DbOpts>): Promise<DbOpts> => ({
  ...opts,
  log: console.log,
  port: opts.port || (await getPort()),
  password: 'repco',
})

export async function startPostgres(opts: Partial<DbOpts>) {
  console.log(REPCO_ROOT)
  const { port, log, password } = await defaultOpts(opts)
  const name = 'repco-' + port
  const env = [
    'POSTGRES_DB=repco',
    'POSTGRES_USER=repco',
    `POSTGRES_PASSWORD=${password}`,
  ]

  if (!opts.temp && !opts.dataDir) {
    throw new Error('Either temp or dataDir is required')
  }
  // mount the prisma migrations into the container, plus a script for initdb that runs
  // all migrations (in alphanumerical order)
  const tmpfs = []
  const volumes = [
    `${REPCO_ROOT}/packages/repco-prisma/prisma/migrations:/docker-entrypoint-initdb.d/migrations:ro`,
    `${REPCO_ROOT}/docker/import-migrations.sh:/docker-entrypoint-initdb.d/import-migrations.sh:ro`,
  ]
  if (opts.temp) {
    tmpfs.push('--tmpfs', '/var/lib/postgresql/data:rw')
  } else {
    volumes.push(`${opts.dataDir}:/var/lib/postgresql/data:rw`)
  }

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

  const databaseUrl = `postgresql://repco:${password}@localhost:${port}/repco`
  const shutdown = async () => {
    await spawn('docker', ['stop', '-t', '0', name])
  }
  return { shutdown, databaseUrl }
}

// ensure all containers are killed on shutdown
process.on('exit', () => {
  for (const pid of dockerPids) {
    try {
      process.kill(pid)
    } catch (_err) {}
  }
})

export function spawn(
  command: string,
  args: string[],
  opts: SpawnOptions & { log?: LogFn; verbose?: boolean } = {},
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

async function waitForLines(stream: Readable, lines: RegExp[]) {
  if (!lines.length) return
  await new Promise<void>((resolve) => {
    let cur = lines.shift()
    stream.on('data', (buf) => {
      for (const line of buf.toString().split('\n')) {
        if (line.match(cur)) {
          cur = lines.shift()
          if (!cur) resolve()
        }
      }
    })
  })
}
