import { NextFunction, Request, Response } from 'express'
import { HttpError, RepoError } from 'repco-core'
import { Prisma } from 'repco-prisma'
import { logger } from './lib.js'

export const notFoundHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next(new ServerError(404, 'Not found'))
}

export const handler = (
  err: Error,
  req: Request,
  res: Response,
  _next: any,
) => {
  ServerError.process(err)
  if (process.env.NODE_ENV !== 'production') {
    logger.warn({ msg: `${req.method} ${req.url} ERR`, err })
  }
  res.status(err.status || 500).json({ ok: false, error: err.message })
}

export class ServerError extends Error {
  _isServerError = true
  constructor(public status: number, message: string, options?: ErrorOptions) {
    super(message, options)
  }

  static is(obj: unknown): obj is ServerError {
    return (
      obj instanceof ServerError ||
      (obj instanceof Error && (obj as any)._isServerError)
    )
  }

  static process(err: any): asserts err is ServerError {
    if (ServerError.is(err)) return
    if (!(err instanceof Error)) err = new Error(String(err))
    let status = 500
    if (RepoError.is(err)) {
      if (err.code === 'NOT_FOUND') {
        status = 404
      }
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
      status = 400
      err.message = err.message.replaceAll('\n', '')
    } else if (err instanceof HttpError) {
      status = err.code || 500
    }
    try {
      ;(err as any).status = status
    } catch (err) {}
  }
}
