import 'source-map-support/register.js'
import getPort from 'get-port'
import { Test } from 'brittle'
import {
  ChildProcess,
  spawn as spawnProcess,
  SpawnOptions,
} from 'node:child_process'
import type { Prisma } from 'repco-prisma'
import { PrismaClient } from '../../lib.js'

const COMPOSE_FILE = '../../test/docker-compose.test.yml'

type SetupOpts = {
  port?: number
}
export async function setup(test: Test, opts: SetupOpts = {}) {
  const pgPort = opts.port || (await getPort())
  const databaseUrl = await setupDb(test, pgPort)
  process.env.DATABASE_URL = databaseUrl
  let log: Prisma.LogDefinition[] = []
  if (process.env.QUERY_LOG) log = [{ emit: 'event', level: 'query' }]
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
  const first = await setup(test)
  const second = await setup(test)
  return [first, second]
}

export async function setupDb(test: Test, port: number) {
  if (process.env.DOCKER_SETUP === '0') return
  const env = {
    ...process.env,
    POSTGRES_PORT: '' + port,
    DATABASE_URL: `postgresql://test:test@localhost:${port}/tests`,
  }
  const verbose = !!process.env.VERBOSE
  await spawn(
    'docker',
    [
      'compose',
      '-p',
      'repco-postgres-test-' + port,
      '-f',
      COMPOSE_FILE,
      'up',
      '-d',
      '--remove-orphans',
    ],
    {
      verbose,
      log: test.comment,
      env,
    },
  )
  await spawn('yarn', ['prisma', 'migrate', 'reset', '-f', '--skip-generate'], {
    log: test.comment,
    verbose,
    env,
  })
  test.teardown(() => {
    spawn(
      'docker',
      [
        'compose',
        '-p',
        'repco-postgres-test-' + port,
        '-f',
        COMPOSE_FILE,
        'down',
      ],
      { verbose },
    ).catch((err) =>
      test.comment('Failed to teardown docker container: ' + err.message),
    )
  }, {})
  return env.DATABASE_URL
}

function spawn(
  command: string,
  args: string[],
  opts: SpawnOptions & { log?: Test['comment']; verbose?: boolean } = {},
): Promise<void> & { child: ChildProcess } {
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
