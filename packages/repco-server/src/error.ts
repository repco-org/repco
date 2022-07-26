import { Request, Response } from 'express'
import { Prisma } from 'repco-prisma'

export const notFoundHandler = async () => {
  throw new ServerError(404, 'Not found')
}

export const handler = (err: Error, _req: Request, res: Response, _next: any) => {
  let status
  let message
  if (ServerError.is(err)) {
    status = err.status
    message = err.message
    console.log('Error: ', err.status, err.message)
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    status = 500
    message = err.message.replaceAll('\n', '')
  } else {
    status = 500
    message = 'Internal server error'
    console.log('Error: ', status, err.message)
  }
  if (process.env.NODE_ENV !== 'production') console.log(err)
  res.status(status).send({ error: message })
}

export class ServerError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }

  static is(obj: unknown): obj is ServerError {
    return obj instanceof ServerError
  }
}
