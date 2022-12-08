import {
  fetch as upstreamFetch,
  getGlobalDispatcher,
  RequestInfo,
  RequestInit,
  Response,
} from 'undici'
import { CachingDispatcher, FsCacheStorage, SimpleCacheStorage } from './fetch.js'

// const CACHE = new SimpleCacheStorage()
const CACHE = new FsCacheStorage('./cache')
const DISPATCHER = new CachingDispatcher(getGlobalDispatcher(), CACHE)

export function fetch(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<Response> {
  init.dispatcher = DISPATCHER
  return upstreamFetch(input, init)
}

main().catch(console.error)
async function main() {
  const url =
    'https://openlibrary.org/api/books?bibkeys=ISBN:0201558025,LCCN:93005405&format=json'
  try {
    for (let i = 0; i < 2; i++) {
      console.time('req')
      const res = await fetch(url)
      console.log('res', res.status, res.headers.get('x-cache'))
      const json = await res.json()
      console.log('json', JSON.stringify(json))
      console.timeEnd('req')
    }
  } catch (err) { console.error(err) }
}
