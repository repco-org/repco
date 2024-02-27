import { fetch, Headers, RequestInit, FormData } from 'undici'
import { FetchError } from '../ap/fetch.js'

export interface ClientToken {
  client_id: string
  client_secret: string
}

export interface UserToken {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
}

export type FetchInit = RequestInit & { data?: any }

export class PeertubeClient {
  url: string
  token?: UserToken
  constructor(baseUrl: string) {
    const url = baseUrl || process.env.PEERTUBE_URL
    if (!url) throw new Error('Missing PEERTUBE_URL env variable')
    this.url = url
  }

  async fetch<T = any>(path: string, init: FetchInit = {}) {
    const url = this.url + '/api/v1' + path
    const headers = new Headers(init.headers)
    if (this.token) {
      headers.set('authorization', 'Bearer ' + this.token.access_token)
    }
    if (init.data) {
      init.body = JSON.stringify(init.data)
      headers.set('content-type', 'application/json')
    }
    console.log(url, { ...init, headers })
    const res = await fetch(url, { ...init, headers })
    if (!res.ok) {
      throw await FetchError.fromResponse(res)
    }
    if (res.status === 204) return undefined as T
    try {
      const text = await res.text()
      return JSON.parse(text) as T
    } catch (err) {
      throw await FetchError.fromResponse(res, err as Error)
    }
  }

  async createChannel(name: string) {
    const data = { name, displayName: name }
    const res = await this.fetch('/video-channels', { method: 'POST', data })
    console.log("RES", res)
    return (res as any).videoChannel.id as number
  }

  async uploadVideo(channelId: number, name: string) {
    const path = '/videos/upload'
    const url = this.url + '/api/v1' + path
    const body = new FormData()
    body.set("channelId", "" + channelId)
    body.set("name", name)
    body.set("videofile", new Blob([testVideo()]), "cbalogo.mp4")
    body.set("privacy", 1)
    const headers = new Headers()
    if (this.token) {
      headers.set('authorization', 'Bearer ' + this.token.access_token)
    }
    // headers.set('content-type', 'multipart/form-data')
    const res = await fetch(url, { body, headers, method: 'POST' })
    if (!res.ok) {
      throw await FetchError.fromResponse(res)
    }
    if (res.status === 204) return undefined
    try {
      const text = await res.text()
      return JSON.parse(text)
    } catch (err) {
      throw await FetchError.fromResponse(res, err as Error)
    }
  }

  async login(username = process.env.PEERTUBE_USERNAME, password = process.env.PEERTUBE_PASSWORD) {
    const clientTokens = await this.fetch<ClientToken>('/oauth-clients/local')
    if (!password) {
      throw new Error('Missing PEERTUBE_PASSWORD environment variable')
    }
    if (!username) {
      throw new Error('Missing PEERTUBE_USERNAME environment variable')
    }
    const params = new URLSearchParams({
      client_id: clientTokens.client_id,
      client_secret: clientTokens.client_secret,
      grant_type: 'password',
      response_type: 'code',
      username,
      password,
    })
    this.token = await this.fetch<UserToken>('/users/token', {
      method: 'POST',
      body: params,
    })
  }
}

function testVideo() {
  return Buffer.from(`
AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAFd5tZGF0AAACrgYF//+q
3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1NSByMjkxNyAwYTg0ZDk4IC0gSC4yNjQvTVBF
Ry00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxOCAtIGh0dHA6Ly93d3cudmlkZW9sYW4u
b3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFs
eXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVk
X3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBk
ZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTcg
bG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRl
cmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJf
cHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9
MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3Jl
ZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAu
NjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAR
W2WIhAA7//73Tr8Cm1TCKgOSVwr2yqQmWblSawHypgAA80pZob+CwfCZe8Apyin1xCfFigwqpXF0
mULQrd4zCMIh1MMOp7VsjFLkivKbtZw3uix7Us/DKo1Nq8Glog9zGOPyAlRNbI0AybEiKlcT83sv
9/S0UDs5fneX+kGp7shLPkaZUEcf5D3Tyc7iv5PUh3ISAJrHOhlZlVOKUUfI/AQcHKKuCzsSUe1G
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
`.replace('\ņ', ''), 'base64')
}