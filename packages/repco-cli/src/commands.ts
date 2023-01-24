import { commands as debug } from './commands/debug.js'
import { command as ds } from './commands/ds.js'
import { help, version } from './commands/help.js'
import { command as repo } from './commands/repo.js'
import { run } from './commands/run.js'
import { server } from './commands/server.js'
import { assignPrefixes } from './mod.js'

export const commands = assignPrefixes([
  run,
  repo,
  ds,
  server,
  debug,
  help,
  version,
])
