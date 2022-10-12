import Dotenv from 'dotenv'
import { Test } from 'brittle'
import {
  ChildProcess,
  spawn as spawnProcess,
  SpawnOptions,
} from 'node:child_process'

const COMPOSE_FILE = '../../test/docker-compose.test.yml'
const ENV_FILE = '../../test/test.env'

let dockerDown = false
let dockerUp = false

Dotenv.config({ path: ENV_FILE })

export async function setup(test: Test) {
  if (!dockerUp) {
    await spawn(
      'docker-compose',
      ['-f', COMPOSE_FILE, 'up', '-d', '--remove-orphans'],
      { log: test.comment },
    )
    dockerUp = true
  }
  await spawn('yarn', ['prisma', 'migrate', 'reset', '-f', '--skip-generate'], {
    cwd: '../repco-prisma',
    log: test.comment,
    stdio: 'inherit'
  })
}

process.on('beforeExit', () => {
  if (dockerDown) return
  spawn('docker-compose', ['-f', COMPOSE_FILE, 'down', '--rm'])
    .catch(() => console.error('>> Failed to teardown docker container.'))
    .finally(() => (dockerDown = true))
})

function spawn(
  command: string,
  args: string[],
  opts: SpawnOptions & { log?: Test['comment'] } = {},
): Promise<void> & { child: ChildProcess } {
  if (!opts.stdio) opts.stdio = 'pipe'
  if (!opts.log) opts.log = (msg: string) => console.error(`# ${msg}`)
  opts.log(`spawn: ${command} ${args.map((x) => `${x}`).join(' ')}`)
  const child = spawnProcess(command, args, opts)
  let stderr = ''
  let stdout = ''
  child.stderr?.on('data', (data) => (stderr += data))
  child.stdout?.on('data', (data) => (stdout += data))
  const promise = new Promise((resolve, reject) => {
    child.on('error', (err) => reject(err))
    child.on('exit', (code) => {
      if (code) {
        const log = stdout + '\n' + stderr
        reject(
          new Error(
            `Command \`${command}\` exited with code ${code}. Command output:\n${log}`,
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
