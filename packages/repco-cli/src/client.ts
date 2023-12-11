import { fetch, Headers, RequestInit } from 'undici'

interface RepcoRequestInit extends RequestInit {
  body?: any
}
export async function request(
  path: string,
  init: RepcoRequestInit = {},
): Promise<unknown> {
  const url = process.env.REPCO_URL + '/api/admin' + path
  const token = process.env.REPCO_ADMIN_TOKEN
  const headers = new Headers(init.headers)
  headers.set('authorization', 'Bearer ' + token)
  headers.set('accept', 'application/json')

  if (init.body) {
    init.body = JSON.stringify(init.body)
    headers.set('content-type', 'application/json')
  }

  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const text = await res.text()
    let error
    try {
      const data = JSON.parse(text)
      error = data.error
    } catch (_err) {
      error = text
    }
    throw new Error('Remote error: ' + error)
  }
  return res.json()
}
