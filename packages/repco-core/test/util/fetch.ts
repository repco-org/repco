import fs from 'fs/promises'
import p from 'path'
import { Test } from 'brittle'
import { readdirSync, unlinkSync } from 'fs'
import { getGlobalDispatcher, setGlobalDispatcher } from 'undici'
import { CachingDispatcher, FsCacheStorage } from '../../src/util/fetch.js'

const globalDispatcher = getGlobalDispatcher()

export const CREATE_FIXTURES = !!process.env.CREATE_FIXTURES
export const CREATE_FETCH_FIXTURES =
  !!process.env.CREATE_FETCH_FIXTURES || CREATE_FIXTURES
export const CREATE_ASSERT_FIXTURES =
  !!process.env.CREATE_ASSERT_FIXTURES || CREATE_FIXTURES

export function mockFetch(test: Test, path: string) {
  if (CREATE_FIXTURES) {
    try {
      for (const file of readdirSync(path)) {
        unlinkSync(p.join(path, file))
      }
    } catch (err) {}
  }
  enableMockFetch(path)
  test.teardown(disableMockFetch, {})
}

export function enableMockFetch(
  dir: string,
  recreateFixtures = CREATE_FETCH_FIXTURES,
) {
  if (recreateFixtures) {
    console.log(`# Writing new test fixtures \`${dir}\``)
  }
  const cache = new FsCacheStorage(dir, { mkdir: true, hashNames: true })
  const dispatcher = new CachingDispatcher(globalDispatcher, cache, {
    forward: recreateFixtures,
  })
  setGlobalDispatcher(dispatcher)
}

export function disableMockFetch() {
  setGlobalDispatcher(globalDispatcher)
}

export async function assertFixture(assert: Test, path: string, data: any) {
  if (CREATE_ASSERT_FIXTURES) {
    await fs.writeFile(path, JSON.stringify(data))
    console.log('# Wrote test fixtures to ' + path)
    assert.is(true, true)
    return
  }
  const fixture = JSON.parse(await fs.readFile(path, 'utf8'))
  assert.alike(JSON.parse(JSON.stringify(data)), fixture)
}
