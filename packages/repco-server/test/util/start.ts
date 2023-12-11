import getPort from 'get-port'
import { Test } from 'brittle'
import { setup } from 'repco-core/dist/test/util/setup.js'
import { runServer } from '../../src/lib.js'

export type StartOpts = {
  hostOverride?: string
}

export async function startServer(assert: Test, opts: StartOpts = {}) {
  const prisma = await setup(assert)
  const port = await getPort()
  const host = opts.hostOverride || 'localhost'
  const url = `http://${host}:${port}`
  const { shutdown, isReady } = runServer(prisma, { port, publicUrl: url })
  assert.teardown(shutdown, { order: Infinity })
  await isReady
  return { url, prisma }
}
