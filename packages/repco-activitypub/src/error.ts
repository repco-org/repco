import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { generateErrorMessage } from 'zod-error'
import { FetchError } from './ap/fetch.js'
import { logger } from './server.js'

/**
 * Error type for errors that should be returned to the client.
 */
export class ApiError extends Error {
  /**
   * @param status HTTP status code to send to the client
   * @param message Error message to send to the client
   */
  constructor(public status: number, message: string) {
    super(message)
  }

  static handle(err: Error, _req: Request, res: Response, _next: NextFunction) {
    let status = 500
    let message = 'internal server error'
    if (err instanceof ZodError) {
      status = 400
      message = generateErrorMessage(err.issues)
    } else if (err instanceof ApiError) {
      status = err.status
      message = err.message
    } else if (err instanceof FetchError) {
      message = err.message
    }
    logger.warn({ msg: 'request produced error', err })
    res.status(status)
    res.json({ ok: false, message, status })
  }
}
