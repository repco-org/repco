import blake3native from 'blake3'
import { bytes } from 'multiformats'
import { from } from 'multiformats/hashes/hasher'

export const blake3 = from({
  name: 'blake3',
  code: 0x1e,
  encode: (input) => bytes.coerce(blake3native.hash(input)),
})
