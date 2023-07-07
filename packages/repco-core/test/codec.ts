import * as b4a from 'b4a'
import * as codec from '../src/repo/codec.js'
import { EdKeypair } from '@ucans/ucans'
import { test } from 'brittle'
import { createCID } from '../src/repo/blockstore.js'

test('codec', async (assert) => {
  const cid = await createCID(new Uint8Array([1]))
  const data = {
    number: 5,
    date: new Date(),
    bytes: new Uint8Array([1, 2, 3]),
    string: 'foo',
    cid,
    arr: [2, 3.5, 4, new Date(), cid],
  }
  const bytes = codec.encode(data)
  const res = codec.decode(bytes)
  assert.alike(data, res, 'decoded matches input')
})

test('codec2', async (assert) => {
  const keypair = await EdKeypair.create()
  const body = { a: 3, b: new Uint8Array([4, 5]) }
  const encoded = codec.encode(body)
  console.log('body', b4a.toString(encoded, 'hex'))
  const sig = await keypair.sign(encoded)
  console.log('sig', b4a.toString(sig, 'hex'))
  const tuple = [encoded, sig]
  const block = codec.encode(tuple)
  console.log('block', b4a.toString(block, 'hex'))
  assert.is(true, true)
})
