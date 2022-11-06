import { NextFunction, Request, Response } from 'express'
import { RepoError } from 'repco-core'
import { Prisma } from 'repco-prisma'

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
  err = ServerError.fromError(err)
  let status
  let message
  if (ServerError.is(err)) {
    status = err.status
    message = err.message
    // console.log('Error: ', err.status, err.message)
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    status = 500
    message = err.message.replaceAll('\n', '')
  } else {
    status = 500
    message = 'Internal server error'
    console.log('Error: ', status, err.message)
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${req.method} ${req.url} ERR`, err)
  }
  res.status(status).json({ ok: false, error: message })
}

export class ServerError extends Error {
  constructor(public status: number, message: string, options?: ErrorOptions) {
    super(message, options)
  }

  static is(obj: unknown): obj is ServerError {
    return (
      obj instanceof ServerError ||
      (obj instanceof Error && typeof (obj as any).status === 'number')
    )
  }

  static fromError(err: any): ServerError {
    if (ServerError.is(err)) return err
    if (!(err instanceof Error)) err = new Error(err)
    let status = 500
    if (RepoError.is(err)) {
      if (err.code === 'NOT_FOUND') {
        status = 404
      }
    }
    ;(err as any).status = status
    return err as ServerError
  }
}
