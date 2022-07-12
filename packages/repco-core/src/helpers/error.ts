export class HttpError extends Error {
  constructor (public code: number, message: string, public details?: any) {
    super(message)
    this.code = code
    this.details = details
  }
  static fromResponse (res: Response) {
    return new HttpError(res.status, res.statusText)
  }
}



