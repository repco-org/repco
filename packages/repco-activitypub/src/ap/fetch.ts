// @ts-ignore
import * as httpDigest from '@digitalbazaar/http-digest-header'
import { createLogger } from 'repco-common'
import { fetch, Headers, RequestInit, Response } from 'undici'
import { Sha256Signer } from './crypto.js'

const DEFAULT_SIGNED_HEADERS = ['(request-target)', 'host', 'date', 'digest']

const logger = createLogger('fetch')
function log(msg: string, data?: Record<string, any>) {
  data = data || {}
  data.msg = msg
  logger.info(data)
}

export type FetchInit = RequestInit & {
  data?: any
  sign?: SignOpts
}

export type SignOpts = {
  privateKeyPem: string
  publicKeyId: string
  signedHeaders?: string[]
}

export class FetchError extends Error {
  get status() {
    return this.res?.status
  }
  get statusText() {
    return this.res?.statusText
  }
  constructor(
    public res: { url: string; status?: number; statusText?: string },
    public cause?: Error | string,
    public details?: string,
  ) {
    let message = `failed to fetch:`
    if (res.url) message += `  ${res.url}`
    if (res.status) message += ` (${res.status} ${res.statusText})`
    if (cause) {
      const reason = typeof cause === 'string' ? cause : cause.message
      message += ` (reason: ${reason})`
    }
    super(message)
  }

  static async fromResponse(res: Response, cause?: Error) {
    let text
    try {
      text = await res.text()
    } catch (_err) {}
    return new FetchError(res, cause, text)
  }
}

export async function fetchAp(url: string | URL, init: FetchInit = {}) {
  url = new URL(url)
  const headers = new Headers(init.headers)
  if (!headers.has('accept')) {
    headers.set(
      'accept',
      'application/activity+json, application/jrd+json, application/json, application/ld+json',
    )
  }
  if (!init.body && init.data) {
    init.body = JSON.stringify(init.data)
    headers.set('content-type', 'application/activity+json')
  }
  headers.set('host', url.host)
  headers.set('date', new Date().toUTCString())

  init.method = init.method || 'GET'

  if (init.sign) {
    // create digest
    const digest = await httpDigest.createHeaderValue({
      data: init.body ?? '',
      algorithm: 'sha256',
      useMultihash: false,
    })
    headers.set('digest', digest)

    // create signature
    const { publicKeyId, privateKeyPem, signedHeaders } = init.sign
    const signer = new Sha256Signer({
      publicKeyId: publicKeyId,
      privateKey: privateKeyPem,
      headerNames: signedHeaders || DEFAULT_SIGNED_HEADERS,
    })
    const signature = signer.sign({
      url,
      method: init.method,
      headers: Object.fromEntries(headers.entries()),
    })
    headers.set('signature', signature)
  }

  init.headers = headers

  // log('fetch: ' + url, {
  //   method: init.method,
  //   body: init.body,
  //   headers: Object.fromEntries(init.headers.entries()),
  // })

  let res
  try {
    res = await fetch(url, init)
    if (!res.ok) throw await FetchError.fromResponse(res)
    if (res.status !== 200) return
    return JSON.parse(await res.text())
  } catch (cause) {
    if (!res) res = { url: url.toString() }
    const err = new FetchError(res, cause as Error)
    log('fetch failed: ' + url + ' ' + err.message)
    throw err
  }
}
