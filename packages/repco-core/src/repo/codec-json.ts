import * as uint8arrays from 'uint8arrays'
import { CID } from 'multiformats/cid'
import type { Ipld } from 'repco-common/zod'

const ISO_DATE_REGEX = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/
const ISO_DATE_LENGTH = 24

export function encodeHeader(value: any): string[] {
  const map = (value: any): any => {
    if (typeof value === 'number' && isNaN(value))
      throw new Error('NaN is not permitted in the IPLD data model')
    if (value === Infinity || value === -Infinity)
      throw new Error('Infinity is not permitted in the IPLD data model')

    if (value instanceof Date) return value.toISOString()
    if (value instanceof CID) return 'cid:' + value.toString()
    if (value instanceof Uint8Array || value instanceof Buffer)
      return 'b64:' + uint8arrays.toString(value, 'base64')
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
  const mapped = map(value)
  if (typeof mapped === 'number' || typeof mapped === 'string')
    return [mapped.toString()]
  else if (Array.isArray(mapped))
    return mapped.filter((x) => x !== null).map((x) => x.toString())
  else if (!mapped) return []
  else return [JSON.stringify(mapped)]
}

export const name = 'dag-cbor'
export const code = 0x71

export function encode(node: any): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(preEncode(node)))
}

export function decode(bytes: Uint8Array) {
  return postDecode(JSON.parse(new TextDecoder().decode(bytes)))
}

function preEncode(value: any): Ipld {
  const map = (value: any): any => {
    if (typeof value === 'number' && isNaN(value))
      throw new Error('NaN is not permitted in the IPLD data model')
    if (value === Infinity || value === -Infinity)
      throw new Error('Infinity is not permitted in the IPLD data model')

    if (value instanceof Date) return value.toISOString()
    if (value instanceof CID) return { '/': value.toString() }
    if (value instanceof Uint8Array || value instanceof Buffer) return { '/': { bytes: uint8arrays.toString(value, 'base64') }}
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
    if (typeof value === 'object' && Object.keys(value).length === 1 && typeof value['/'] === 'string') {
      return CID.parse(value['/'])
    }
    if (typeof value === 'object' && Object.keys(value).length === 1 && typeof value['/'] === 'object' && Object.keys(value['/']).length === 1 && typeof value['/']['bytes'] === 'string') {
      return uint8arrays.fromString(value['/']['bytes'], 'base64')
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
