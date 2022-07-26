import { Request, Response } from 'express'

export const notFoundHandler = async () => {
  throw new ServerError(404, 'Not found')
}

export const handler = (err: Error, _req: Request, res: Response, _next: any) => {
  let status
  if (ServerError.is(err)) {
    status = err.status
    console.log('Error: ', err.status, err.message)
  } else {
    status = 500
    console.log('Error: ', status, err.message)
  }
  if (process.env.NODE_ENV !== 'production') console.log(err)
  res.status(status).send({ error: err.message })
}

export class ServerError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }

  static is(obj: unknown): obj is ServerError {
    return obj instanceof ServerError
  }
}
