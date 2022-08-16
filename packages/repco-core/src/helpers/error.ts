/**
 * Helper function for error handling of a fetch request
 */
import { Response } from 'undici'

type ErrorJson = {
  message?: string
}

export class HttpError extends Error {
  constructor(public code: number, message: string, public details?: any) {
    super(message)
    this.code = code
    this.details = details
  }
  static async fromResponseJson(response: Response): Promise<HttpError> {
    try {
      const errorJson = await response.json()
      if (typeof errorJson === 'object' && errorJson) {
        return HttpError.fromResponse(
          response,
          (errorJson as ErrorJson).message,
          errorJson,
        )
      }
    } catch (_err) {}
    return HttpError.fromResponse(response)
  }

  static fromResponse(
    response: Response,
    message?: string,
    details?: unknown,
  ): HttpError {
    return new HttpError(
      response.status,
      message || response.statusText,
      details,
    )
  }
}
