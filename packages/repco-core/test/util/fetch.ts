import fs from 'fs/promises'
import { Test } from 'brittle'
import { getGlobalDispatcher, setGlobalDispatcher } from 'undici'
import { CachingDispatcher, FsCacheStorage } from '../../src/util/fetch.js'

const globalDispatcher = getGlobalDispatcher()

export const CREATE_FIXTURES = !!process.env.CREATE_FIXTURES
export const CREATE_FETCH_FIXTURES =
  !!process.env.CREATE_FETCH_FIXTURES || CREATE_FIXTURES
export const CREATE_ASSERT_FIXTURES =
  !!process.env.CREATE_ASSERT_FIXTURES || CREATE_FIXTURES

export function mockFetch(test: Test, scope: string) {
  enableMockFetch(scope)
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
