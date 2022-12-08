import type { Duplex } from 'stream'
import fs from 'fs/promises'
import p from 'path'
import { Dispatcher } from 'undici'

// export function fetch(
//   input: RequestInfo,
//   init: RequestInit = {},
// ): Promise<Response> {
//   init.dispatcher = DISPATCHER
//   return upstreamFetch(input, init)
// }

export class CachingDispatcher extends Dispatcher {
  private cache: CacheStorage
  private dispatcher: Dispatcher // wrap another dispatcher

  constructor(dispatcher: Dispatcher, cache: CacheStorage) {
    super()
    this.dispatcher = dispatcher
    this.cache = cache
  }

  dispatch(
    options: Dispatcher.DispatchOptions,
    handler: Dispatcher.DispatchHandlers,
  ): boolean {
    const key = serializeDispatchOptionsToKey(options)
    this.cache.getCache(key).then(
      (cachedRequest) => {
        if (!cachedRequest || cachedRequest.isExpire()) {
          const cacheHandlers = new CacheHandlers(this.cache, handler, key)
          this.dispatcher.dispatch(options, cacheHandlers) // ignore drain status...
        } else {
          const headers = cachedRequest.getHeaders()
          headers.push('X-Cache', 'HIT')
          if (handler.onHeaders)
            handler.onHeaders(cachedRequest.getStatusCode(), headers, () => {})
          if (handler.onData)
            handler.onData(Buffer.from(cachedRequest.getData()))
          if (handler.onComplete)
            handler.onComplete(cachedRequest.getTrailers())
        }
      },
      (error) => {},
    )
    return false
  }
}

export class CacheHandlers {
  chunks: Buffer[] = []
  headers: string[] = []
  statusCode = 0

  constructor(
    private cache: CacheStorage,
    private inner: Dispatcher.DispatchHandlers,
    private key: string,
  ) {}
  onConnect(abort: () => void) {
    if (this.inner.onConnect) this.inner.onConnect(abort)
  }
  /** Invoked when an error has occurred. */
  onError(err: Error): void {
    if (this.inner.onError) this.inner.onError(err)
  }
  /** Invoked when request is upgraded either due to a `Upgrade` header or `CONNECT` method. */
  onUpgrade(
    statusCode: number,
    headers: Buffer[] | string[] | null,
    socket: Duplex,
  ): void {
    if (this.inner.onUpgrade) this.inner.onUpgrade(statusCode, headers, socket)
  }
  /** Invoked when statusCode and headers have been received. May be invoked multiple times due to 1xx informational headers. */
  onHeaders(
    statusCode: number,
    headers: Buffer[] | string[] | null,
    resume: () => void,
  ): boolean {
    let stringHeaders = null
    if (headers) {
      stringHeaders = headers.map((h) => h.toString())
      for (const h of stringHeaders) {
        this.headers.push(h)
      }
    }
    this.statusCode = statusCode
    if (this.inner.onHeaders) {
      if (stringHeaders) stringHeaders.push('X-Cache', 'MISS')
      return this.inner.onHeaders(statusCode, stringHeaders, resume)
    }
    return false
  }
  /** Invoked when response payload data is received. */
  onData(chunk: Buffer): boolean {
    this.chunks.push(chunk)
    if (this.inner.onData) return this.inner.onData(chunk)
    return false
  }
  /** Invoked when response payload and trailers have been received and the request has completed. */
  onComplete(trailers: string[] | null): void {
    if (this.inner.onComplete) this.inner.onComplete(trailers)
    const len = this.chunks.reduce((sum, c) => sum + c.length, 0)
    const data = new Uint8Array(len)
    let offset = 0
    for (const chunk of this.chunks) {
      data.set(chunk, offset)
      offset += chunk.length
    }
    const req = new SimpleCachedRequest()
    req.statusCode = this.statusCode
    req.data = data
    req.headers = this.headers
    this.cache.setCache(this.key, req)
  }
  /** Invoked when a body chunk is sent to the server. May be invoked multiple times for chunked requests */
  onBodySent(chunkSize: number, totalBytesSent: number): void {
    if (this.inner.onBodySent) this.inner.onBodySent(chunkSize, totalBytesSent)
  }
}

function serializeDispatchOptionsToKey(options: Dispatcher.DispatchOptions) {
  const query = options.query
    ? Object.entries(options.query)
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
    : ''
  return [options.method, options.origin, options.path, query].join('!')
}

export interface CachedRequest {
  isExpire(): boolean
  getHeaders(): string[]
  getData(): Uint8Array
  getTrailers(): string[] | null
  getStatusCode(): number
}

class SimpleCachedRequest implements CachedRequest {
  public headers: string[] = []
  public data = new Uint8Array()
  public trailers: string[] | null = null
  public statusCode = 0
  isExpire() {
    return false
  }
  getHeaders() {
    return this.headers
  }
  getStatusCode() {
    return this.statusCode
  }
  getData() {
    return this.data
  }
  getTrailers() {
    return this.trailers
  }

  static fromBlob(metaString: string, data: Uint8Array) {
    const meta = JSON.parse(metaString)
    const req = new SimpleCachedRequest()
    req.headers = meta.headers
    req.statusCode = meta.statusCode
    req.trailers = meta.trailers
    req.data = data
    return req
  }
}

function encodeRequest(req: CachedRequest) {
  const meta = {
    headers: req.getHeaders(),
    statusCode: req.getStatusCode(),
    trailers: req.getTrailers()
  }
  return {
    data: req.getData(),
    meta: JSON.stringify(meta),
  }
}

export interface CacheStorage {
  getCache(key: string): Promise<CachedRequest | null>
  setCache(key: string, request: CachedRequest): Promise<void>
}

export class SimpleCacheStorage {
  data: Record<string, CachedRequest> = {}
  async getCache(key: string): Promise<CachedRequest | null> {
    return this.data[key] || null
  }
  async setCache(key: string, request: CachedRequest): Promise<void> {
    this.data[key] = request
  }
}

export class FsCacheStorage {
  constructor(private path: string) {}
  async getCache(key: string): Promise<CachedRequest | null> {
    try {
      const meta = await fs.readFile(this._metaPath(key))
      const body = await fs.readFile(this._bodyPath(key))
      return SimpleCachedRequest.fromBlob(meta.toString(), body)
    } catch (err) {
      return null
    }
  }
  async setCache(key: string, request: CachedRequest): Promise<void> {
    const { meta, data } = encodeRequest(request)
    await fs.writeFile(this._metaPath(key), meta)
    await fs.writeFile(this._bodyPath(key), data)
  }

  _bodyPath(key: string) {
    const encoded = encodeURIComponent(key)
    return p.join(this.path, encoded + '.meta.json')
  }

  _metaPath(key: string) {
    const encoded = encodeURIComponent(key)
    return p.join(this.path, encoded + '.body')
  }
}
