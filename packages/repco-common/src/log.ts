import pino from 'pino'
import type { Logger } from 'pino'
export type { Logger } from 'pino'

const rootLogger = pino()

export function createLogger(name: string): Logger {
  return rootLogger.child({ name })
}
