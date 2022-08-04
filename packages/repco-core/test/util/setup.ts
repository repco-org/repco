import Dotenv from 'dotenv'
import { Test } from 'brittle'
import {
  ChildProcess,
  spawn as spawnProcess,
  SpawnOptions,
} from 'node:child_process'

const COMPOSE_FILE = '../../test/docker-compose.test.yml'
const ENV_FILE = '../../test/test.env'

Dotenv.config({ path: ENV_FILE })

export async function setup(teardown: Test['teardown']) {
  await spawn('docker-compose', [
    '-f',
    COMPOSE_FILE,
    'up',
    '-d',
    '--remove-orphans',
  ])
  await new Promise((resolve) => setTimeout(resolve, 500))
  await spawn('yarn', ['prisma', 'migrate', 'deploy'], {
    cwd: '../repco-prisma',
  })
  teardown(async () => {
    await spawn('docker-compose', ['-f', COMPOSE_FILE, 'down'])
  }, {})
}

function spawn(
  command: string,
  args: string[],
  opts: SpawnOptions = {},
): Promise<void> & { child: ChildProcess } {
  if (!opts.stdio) opts.stdio = 'inherit'
  console.error(`>> ${command} ${args.map((x) => `"${x}"`).join(' ')}`)
  const child = spawnProcess(command, args, opts)
  const promise = new Promise((resolve, reject) => {
    child.on('error', (err) => reject(err))
    child.on('exit', (code) => {
      if (code)
        reject(new Error(`Command \`${command}\` exited with code ${code}`))
      else resolve()
    })
  }) as ReturnType<typeof spawn>
  promise.child = child
  return promise
}
