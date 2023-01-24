import test from 'brittle'
import { GGraph } from '../src/repo/graph.js'

test('regular', async (assert) => {
  const g = new GGraph()
  g.push('a', ['b', 'c'])
  g.push('b', ['c'])
  g.push('c', ['d', 'e'])
  g.push('d', ['e'])
  g.push('e', [])
  const stack = g.resolve()
  assert.alike(stack, ['e', 'd', 'c', 'b', 'a'])
})

test('circular', async (assert) => {
  const g = new GGraph()
  g.push('a', ['b'])
  g.push('b', ['a'])
  assert.exception(() => g.resolve(), /recursion/i)
})

test('circular 2nd order', async (assert) => {
  const g = new GGraph()
  g.push('a', ['b'])
  g.push('b', ['c'])
  g.push('c', ['e', 'd'])
  g.push('e', ['f'])
  g.push('d', ['c'])
  g.push('f', ['b'])
  assert.exception(() => g.resolve(), /recursion/i)
})

test('missing', async (assert) => {
  const g = new GGraph()
  g.push('a', ['b'])
  assert.exception(() => g.resolve(), /missing/i)
})

test('order', async (assert) => {
  const g = new GGraph()
  g.push('a', ['c'])
  g.push('c', ['b'])
  g.push('b', [])
  g.push('d', ['a', 'c'])
  const stack = g.resolve()
  assert.alike(stack, ['b', 'c', 'a', 'd'])
})

test('other', async (assert) => {
  const g = new GGraph()
  g.push('d', [])
  g.push('a', ['b'])
  g.push('e', ['d'])
  g.push('b', ['c', 'd'])
  g.push('c', ['d'])
  const stack = g.resolve()
  assert.alike(stack, ['d', 'c', 'b', 'a', 'e'])
})
