import { PrismaClient } from 'repco-prisma'
import { runServer } from 'repco-server'
import { createCommand } from '../parse.js'

export const server = createCommand({
  name: 'server',
  help: 'Start the repco API server',
  options: {
    port: { type: 'string', short: 'p', help: 'Port to listen on' },
  },
  async run(opts) {
    const prisma = new PrismaClient()
    const port = Number(opts.port) || Number(process.env.PORT) || 8765
    runServer(prisma, { port })
  },
})
