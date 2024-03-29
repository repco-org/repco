/**
 * Helper function for error handling of a fetch request
 */

import { Response } from 'undici'
import { ZodError } from 'zod'

interface Ok<T> {
  ok: true
  res: T
  err?: never
}
interface Err<E> {
  ok: false
  err: E
  res?: never
}
type Result<T, E> = Ok<T> | Err<E>

export async function tryCatch<T, E>(
  inner: () => Promise<T>,
  mapError: (error: any) => E,
): Promise<Result<T, any>> {
  try {
    const res = await inner()
    return { ok: true, res }
  } catch (err) {
    return { ok: false, err: mapError(err) }
  }
}

export class ParseError extends ZodError {
  entityType: string
  constructor(err: ZodError, entityType: string) {
    super(err.issues)
    this.entityType = entityType
  }

  get message() {
    return `Failed to parse ${this.entityType} entity: ${super.message}`
  }
}

type ErrorJson = {
  message?: string
}

export class HttpError extends Error {
  constructor(
    public code: number,
    message: string,
    public details?: any,
    public url?: string | URL,
  ) {
    super(message)
    this.code = code
    this.cause = details
    this.url = url?.toString()
  }
  toString() {
    return `Failed to fetch: ${this.message} (URL: ${this.url})`
  }
  static async fromResponseJson(
    response: Response,
    url?: URL | string,
  ): Promise<HttpError> {
    try {
      const text = await response.text()
      try {
        const errorJson = JSON.parse(text)
        if (typeof errorJson === 'object' && errorJson) {
          return HttpError.fromResponse(
            response,
            url,
            (errorJson as ErrorJson).message,
            errorJson,
          )
        }
      } catch (err) {
        return HttpError.fromResponse(response, url, text)
      }
    } catch (_err) {}
    return HttpError.fromResponse(response, url)
  }

  static fromResponse(
    response: Response,
    url?: URL | string,
    message?: string,
    details?: unknown,
  ): HttpError {
    return new HttpError(
      response.status,
      message || response.statusText,
      details,
      url,
    )
  }
}
