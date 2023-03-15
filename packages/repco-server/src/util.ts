import type { Request, Response } from 'express'
import { HEADER_NDJSON } from './constants.js'

type RequestT = Request<any, any, any, any, Record<string, any>>


export async function* batchAsyncIterator<T>(
  iter: AsyncIterable<T>,
  batchSize: number,
): AsyncIterable<T[]> {
  let batch = []
  for await (const line of iter) {
    batch.push(line)
    if (batch.length === batchSize) {
      yield batch
      batch = []
    }
  }
  if (batch.length) yield batch
}

export async function* parseNdjsonLines<T = any>(
  body: AsyncIterable<Uint8Array>,
): AsyncIterable<T> {
  let buf = ''
  for await (const chunk of body) {
    buf += new TextDecoder().decode(chunk)
    const parts = buf.split('\n')
    const last = parts.pop()
    if (last === undefined) continue
    if (last !== '') buf = last
    else buf = ''
    for (const line of parts) {
      yield JSON.parse(line) as T
    }
  }
  if (buf.length) yield JSON.parse(buf) as T
}

export function sendNdJson(res: Response, data: any[]): Response {
  const body = data.map((r) => JSON.stringify(r)).join('\n') + '\n'
  res.header('content-type', HEADER_NDJSON)
  res.send(body)
  return res
}

export async function sendNdJsonStream<S extends AsyncIterable<any>>(
  res: Response,
  stream: S,
): Promise<void> {
  res.header('content-type', HEADER_NDJSON)
  for await (const row of stream) {
    const line = JSON.stringify(row) + '\n'
    res.write(line)
  }
  res.end()
}

export async function* flattenStream(stream: AsyncIterable<any>) {
  for await (const chunk of stream) {
    if (Array.isArray(chunk)) {
      for (const row of chunk) {
        yield row
      }
    } else {
      yield chunk
    }
  }
}

export async function collectStream<T = any>(
  stream: AsyncIterable<T>,
): Promise<T[]> {
  const rows = []
  for await (const row of stream) {
    rows.push(row)
  }
  return rows
}

export function acceptNdJson(req: RequestT) {
  return (
    req.query.format?.toString() === 'ndjson' ||
    req.headers.accept === HEADER_NDJSON ||
    req.headers.accept === 'ndjson'
  )
}
