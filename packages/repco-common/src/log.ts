import module from 'module'
import p from 'path'
import pino, { LoggerOptions } from 'pino'
import type { Logger } from 'pino'

// Fix thread-stream error due to __dirname
// @see https://github.com/pinojs/thread-stream/issues/112
// @ts-ignore
globalThis.__bundlerPathsOverrides = {
  'thread-stream-worker': p.join(
    p.dirname(module.createRequire(import.meta.url).resolve('thread-stream')),
    'lib',
    'worker.js',
  ),
}

export type { Logger } from 'pino'

const opts: LoggerOptions = {}
if (!process.env.LOG_JSON) {
  opts.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
    },
  }
}

const rootLogger = pino(opts)
rootLogger.level = process.env.LOG_LEVEL || 'info'

export function createLogger(name: string): Logger {
  return rootLogger.child({ name })
}

export const log = createLogger('repco')
