import { blake3 as blake3hash } from '@noble/hashes/blake3'
import { bytes } from 'multiformats'
import { from } from 'multiformats/hashes/hasher'

export const blake3 = from({
  name: 'blake3',
  code: 0x1e,
  encode: (input) => bytes.coerce(blake3hash(input)),
})
