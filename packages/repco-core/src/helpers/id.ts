import { createHash, randomBytes } from 'crypto'
import { base32 } from "multiformats/bases/base32"
import { base64 } from "multiformats/bases/base64"

let ID_COUNTER = 0
const COUNTER_MAX = 1000

export function createRevisionId (timestamp?: Date | number): string {
  return MultiID.createTimeAndRandom(timestamp).toString()
}

export enum IDFormats {
  TimeAndRandom = 'r',
  TimeAndHash = 'h',
  TimeAndURNHash = 'u',
}

export class MultiID {
  str: string

  static decode(input: string): [string, number, number, Uint8Array] {
    return new MultiID(input).decode()
  }

  static toBytes(input: string): Uint8Array {
    return new MultiID(input).toBytes()
  }

  static createTimeAndRandom(timestamp?: number | Date) {
    timestamp = parseOrNow(timestamp)
    const tsbuf = encodeTimestamp(timestamp)
    const randbuf = randomBytes(8)
    return MultiID.fromParts(IDFormats.TimeAndRandom, tsbuf, randbuf)
  }

  static fromParts(prefix: IDFormats, part1: Uint8Array, part2: Uint8Array): MultiID {
    const parts = [
      base32.baseEncode(part1),
      prefix,
      base32.baseEncode(part2)
    ]
    const str = parts.join('')
    return new MultiID(str)
  }

  static createTimeAndURNHash (urn: string, timestamp?: number | Date) {
    timestamp = parseOrNow(timestamp)
    const tsbuf = encodeTimestamp(timestamp)
    const buf = createHash('sha256').update(urn).digest()
    const urnhashbuf = Buffer.concat([buf.slice(0, 7), buf.slice(31, 32)])
    // console.log({ tsbuf: tsbuf.length, urnhashbuf: urnhashbuf.length })
    return MultiID.fromParts(IDFormats.TimeAndURNHash, tsbuf, urnhashbuf)
  }

  constructor (str: string) {
    this.str = str.replace(/-/, '')
  }

  toString (): string {
    // return this.str.substring(0, 12) + '-' + this.str.substring(12, 13) + '-' + this.str.substring(13)
    return this.str
  }

  toBase64 (): string {
    return base64.baseEncode(this.toBytes())
  }

  toJSON(): string {
    return this.str
  }

  decode(): [string, number, number, Uint8Array] {
    const [typ, tsbuf, hashbuf] = this.intoParts()
    const [ts, cnt] = decodeTimestamp(tsbuf)
    return [typ, ts, cnt, hashbuf]
  }

  intoParts(): [string, Uint8Array, Uint8Array] {
    // console.log(this, this.str.length)
    const tsstr = this.str.substring(0, 12)
    const prefix = this.str.substring(12, 13)
    const hashstr = this.str.substring(13)
    const tsbuf = base32.baseDecode(tsstr)
    const hashbuf = base32.baseDecode(hashstr)
    return [prefix, tsbuf, hashbuf]
  }

  toBytes (): Uint8Array {
    const parts = this.intoParts()
    const idbuf = Buffer.alloc(1)
    idbuf.write(parts[0])
    return Buffer.concat([
      parts[1],
      idbuf,
      parts[2]
    ])
  }


}

function parseOrNow(timestamp?: number | Date): number {
  if (timestamp === undefined) timestamp = Date.now()
  if (timestamp instanceof Date) timestamp = timestamp.getTime()
  return timestamp
}

function encodeTimestamp (timestamp: number): Uint8Array {
  const cnt = ++ID_COUNTER
  const n = BigInt(timestamp) * BigInt(COUNTER_MAX) + BigInt(cnt)
  const tsbufFull = Buffer.alloc(8)
  // const n = (BigInt(timestamp) << BigInt(7)) + BigInt(++ID_COUNTER)
  tsbufFull.writeBigInt64BE(n)
  // tsbufFull.writeBigInt64BE(BigInt(timestamp))
  const tsbuf = tsbufFull.slice(1, 8)
  // console.log('enc tf', { tsbufFull, tsbuf, n, cnt, timestamp })
  return tsbuf
}

function decodeTimestamp(buf: Uint8Array): [number, number] {
  const full = Buffer.concat([Buffer.from([0x0]), buf])
  // const n = full.readBigInt64BE()
    // const tsbufFull = Buffer.concat([Buffer.alloc(2, 0), tsbuf])
  const n = full.readBigInt64BE()
  const cnt = n % BigInt(COUNTER_MAX)
  const ts  = (n - cnt) / BigInt(COUNTER_MAX)
  // console.log('dec ts', { buf: Buffer.from(buf), full, n, cnt, ts })
  return [Number(ts), Number(cnt)]
}
