import fs from 'fs/promises'
import p from 'path'
import { createHash } from 'crypto'
import type { Duplex } from 'stream'
import { Dispatcher } from 'undici'

export type CachingDispatcherOpts = {
  forward: boolean
}

export const DEFAULT_CACHING_DISPATCHER_OPTS: CachingDispatcherOpts = {
  forward: true,
}

export class CachingDispatcher extends Dispatcher {
  private cache: ICacheStorage
  private dispatcher: Dispatcher // wrap another dispatcher
  private opts: CachingDispatcherOpts

  constructor(
    dispatcher: Dispatcher,
    cache: ICacheStorage,
    opts: Partial<CachingDispatcherOpts> = {},
  ) {
    super()
    this.dispatcher = dispatcher
    this.cache = cache
    this.opts = { ...DEFAULT_CACHING_DISPATCHER_OPTS, ...opts }
  }

  dispatch(
    options: Dispatcher.DispatchOptions,
    handlers: Dispatcher.DispatchHandlers,
  ): boolean {
    const key = serializeDispatchOptionsToKey(options)
    this.cache
      .getCache(key)
      .then((cachedResponse) => {
        if (!cachedResponse || cachedResponse.isExpired()) {
          // Not in cache: Forward to outer dispatcher and store result in cache
          if (!this.opts.forward) {
            // If fowwarding is disabled: Error with 503
            if (handlers.onHeaders) handlers.onHeaders(503, [], () => {})
            if (handlers.onComplete) handlers.onComplete([])
            return
          }
          const cachingHandlers = new DispatchAndCacheHandlers(
            this.cache,
            handlers,
            key,
            options,
          )
          this.dispatcher.dispatch(options, cachingHandlers) // ignore drain status...
        } else {
          // Found in cache: Extract and pass to outer handlers
          const headers = [...cachedResponse.headers]
          headers.push('X-Cache', 'HIT')
          if (handlers.onHeaders)
            handlers.onHeaders(cachedResponse.status, headers, () => {})
          if (handlers.onData) handlers.onData(Buffer.from(cachedResponse.data))
          if (handlers.onComplete) handlers.onComplete(cachedResponse.trailers)
        }
      })
      .catch((_error) => {})
    return false
  }
}

export class BlackholeHandlers implements Dispatcher.DispatchHandlers {
  onConnect(abort: () => void) {
    abort()
  }
}

export class DispatchAndCacheHandlers implements Dispatcher.DispatchHandlers {
  chunks: Buffer[] = []
  headers: string[] = []
  statusCode = 0

  constructor(
    private cache: ICacheStorage,
    private inner: Dispatcher.DispatchHandlers,
    private key: string,
    private options: Dispatcher.DispatchOptions,
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
    this.statusCode = statusCode
    let stringHeaders: string[] | null = null
    if (headers) {
      stringHeaders = headers.map((h: Buffer | string) => h.toString())
      this.headers.push(...stringHeaders)
    }
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
    const len = this.chunks.reduce((sum, c) => sum + c.length, 0)
    const data = new Uint8Array(len)
    let offset = 0
    for (const chunk of this.chunks) {
      data.set(chunk, offset)
      offset += chunk.length
    }
    const req = new CachedResponse()
    req.status = this.statusCode
    req.data = data
    req.headers = this.headers
    req.url = urlFromDispatchOptions(this.options)
    req.method = this.options.method
    this.cache.setCache(this.key, req).finally(() => {
      if (this.inner.onComplete) this.inner.onComplete(trailers)
    })
  }
  /** Invoked when a body chunk is sent to the server. May be invoked multiple times for chunked requests */
  onBodySent(chunkSize: number, totalBytesSent: number): void {
    if (this.inner.onBodySent) this.inner.onBodySent(chunkSize, totalBytesSent)
  }
}

function urlFromDispatchOptions(options: Dispatcher.DispatchOptions) {
  const query = options.query
    ? '?' +
      Object.entries(options.query)
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
    : ''
  return [options.origin, options.path, query].join('')
}

function serializeDispatchOptionsToKey(options: Dispatcher.DispatchOptions) {
  return options.method + '!' + urlFromDispatchOptions(options)
}

export interface ICachedResponse {
  isExpired(): boolean
  headers: string[]
  data: Uint8Array
  trailers: string[] | null
  status: number
  method: string
  url: string
}

class CachedResponse implements ICachedResponse {
  public headers: string[] = []
  public data = new Uint8Array()
  public trailers: string[] | null = null
  public status = 0
  public method = 'GET'
  public url = ''
  isExpired() {
    return false
  }
  static fromBlob(metaJson: string, data: Uint8Array) {
    const meta = JSON.parse(metaJson)
    const req = new CachedResponse()
    req.headers = meta.headers
    req.status = meta.status
    req.trailers = meta.trailers
    req.url = meta.url
    req.method = meta.method
    req.data = data
    return req
  }
}

function encodeRequest(req: ICachedResponse) {
  const meta = {
    method: req.method,
    url: req.url,
    status: req.status,
    headers: req.headers,
    trailers: req.trailers,
  }
  return {
    data: req.data,
    meta: JSON.stringify(meta),
  }
}

export interface ICacheStorage {
  getCache(key: string): Promise<ICachedResponse | null>
  setCache(key: string, request: ICachedResponse): Promise<void>
}

export class MemoryCacheStorage implements ICacheStorage {
  data: Record<string, ICachedResponse> = {}
  async getCache(key: string): Promise<ICachedResponse | null> {
    return this.data[key] || null
  }
  async setCache(key: string, request: ICachedResponse): Promise<void> {
    this.data[key] = request
  }
}

export type FsCacheOptions = {
  mkdir?: boolean
  hashNames?: boolean
}

export class FsCacheStorage implements ICacheStorage {
  private _init = false
  readonly opts: FsCacheOptions
  constructor(readonly path: string, opts?: FsCacheOptions) {
    this.opts = { mkdir: true, hashNames: false, ...opts }
  }
  async getCache(key: string): Promise<ICachedResponse | null> {
    try {
      const meta = await fs.readFile(this._metaPath(key))
      const body = await fs.readFile(this._bodyPath(key))
      return CachedResponse.fromBlob(meta.toString(), body)
    } catch (err) {
      return null
    }
  }
  async setCache(key: string, request: ICachedResponse): Promise<void> {
    if (!this._init && this.opts.mkdir) {
      await fs.mkdir(this.path, { recursive: true })
    }
    const { meta, data } = encodeRequest(request)
    await fs.writeFile(this._metaPath(key), meta)
    await fs.writeFile(this._bodyPath(key), data)
  }

  _bodyPath(key: string) {
    let encoded = encodeURIComponent(key)
    if (this.opts.hashNames) {
      encoded = createHash('sha256').update(encoded).digest('hex')
    }
    return p.join(this.path, encoded + '.body')
  }

  _metaPath(key: string) {
    let encoded = encodeURIComponent(key)
    if (this.opts.hashNames) {
      encoded = createHash('sha256').update(encoded).digest('hex')
    }
    return p.join(this.path, encoded + '.meta.json')
  }
}
