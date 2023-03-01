import * as cbor from 'cbor-x'
import { CID } from 'multiformats/cid'
import type { Ipld } from 'repco-common/zod'

// Encode JS objects as DAG-CBOR with the cbor-x encoder.
// Decode ISO-8601 strings into Date objects.
// Preprocess data to convert date to strings.

// https://github.com/ipfs/go-ipfs/issues/3570#issuecomment-273931692
const CID_CBOR_TAG = 42

export const name = 'dag-cbor'
export const code = 0x71

const encoder = new cbor.Encoder({
  useRecords: false,
  mapsAsObjects: true,
  // tagUint8Array: false,
})
cbor.addExtension({
  Class: CID,
  tag: CID_CBOR_TAG,
  encode(value, encodeFn) {
    const cid = CID.asCID(value)
    if (!cid) throw new Error('Invalid CID: ' + value)
    const bytes = new Uint8Array(cid.bytes.byteLength + 1)
    bytes.set(cid.bytes, 1) // prefix is 0x00, for historical reasons
    return encodeFn(bytes)
  },
  decode(bytes: Uint8Array) {
    if (bytes[0] !== 0) {
      throw new Error('Invalid CID for CBOR tag 42; expected leading 0x00')
    }
    return CID.decode(bytes.subarray(1)) // ignore leading 0x00
  },
})

export function encode(node: any): Uint8Array {
  return encoder.encode(preEncode(node))
}

export function decode(bytes: Uint8Array) {
  return postDecode(encoder.decode(bytes))
}

const ISO_DATE_REGEX = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/
const ISO_DATE_LENGTH = 24

function preEncode(value: any): Ipld {
  const map = (value: any): any => {
    if (typeof value === 'number' && isNaN(value))
      throw new Error('NaN is not permitted in the IPLD data model')
    if (value === Infinity || value === -Infinity)
      throw new Error('Infinity is not permitted in the IPLD data model')

    if (value instanceof Date) return value.toISOString()
    if (value instanceof CID) return value
    if (value instanceof Uint8Array) return value
    if (value instanceof Buffer) return value.buffer
    if (value === undefined || value === null) return null

    if (value instanceof Set) value = Array.from(value).sort()
    if (value instanceof Map) value = Object.fromEntries(value.entries())

    if (Array.isArray(value)) return value.map(map)
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value)
          .map(([k, v]) => [k, map(v)])
          .sort((a, b) => (a[0] > b[0] ? 1 : -1)),
      )
    }

    return value
  }
  return map(value)
}

function postDecode(value: any): any {
  const map = (value: any): any => {
    if (typeof value === 'string') {
      if (value.length === ISO_DATE_LENGTH && ISO_DATE_REGEX.test(value)) {
        const date = new Date(value)
        if (date.toISOString() === value) return date
      }
      return value
    }
    if (value instanceof CID) return value
    if (value instanceof Uint8Array) return value
    if (value instanceof Buffer) return value.buffer
    if (value === undefined || value === null) return null
    if (Array.isArray(value)) return value.map(map)
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, map(v)]),
      )
    }
    return value
  }
  return map(value)
}
