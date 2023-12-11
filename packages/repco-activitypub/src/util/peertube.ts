import { fetch, Headers, RequestInit } from 'undici'
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

  async login() {
    const clientTokens = await this.fetch<ClientToken>('/oauth-clients/local')
    const { PEERTUBE_USERNAME, PEERTUBE_PASSWORD } = process.env
    if (!PEERTUBE_PASSWORD) {
      throw new Error('Missing PEERTUBE_PASSWORD environment variable')
    }
    if (!PEERTUBE_USERNAME) {
      throw new Error('Missing PEERTUBE_USERNAME environment variable')
    }
    const params = new URLSearchParams({
      client_id: clientTokens.client_id,
      client_secret: clientTokens.client_secret,
      grant_type: 'password',
      response_type: 'code',
      username: PEERTUBE_USERNAME,
      password: PEERTUBE_PASSWORD,
    })
    this.token = await this.fetch<UserToken>('/users/token', {
      method: 'POST',
      body: params,
    })
  }
}
