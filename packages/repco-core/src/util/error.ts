/**
 * Helper function for error handling of a fetch request
 */

import { Response } from 'undici'
import { ZodError } from 'zod'

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
    this.details = details
    this.url = url?.toString()
  }
  static async fromResponseJson(
    response: Response,
    url?: URL | string,
  ): Promise<HttpError> {
    try {
      const errorJson = await response.json()
      if (typeof errorJson === 'object' && errorJson) {
        return HttpError.fromResponse(
          response,
          url,
          (errorJson as ErrorJson).message,
          errorJson,
        )
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
