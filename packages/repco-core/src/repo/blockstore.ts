import * as codec from '@ipld/dag-cbor'
import * as Block from 'multiformats/block.js'
import { blake2b256 as hasher } from '@multiformats/blake2/blake2b'
import { CID } from 'multiformats/cid.js'
// import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { PrismaClient } from 'repco-prisma'

export interface IpldBlockStore {
  put(data: any): Promise<CID>
  get(cid: CID): Promise<IpldRecord>
  parse(bytes: Uint8Array | Buffer): IpldRecord
  has(cid: CID): Promise<boolean>
  getBatch(cids: CID[]): Promise<(IpldRecord | null)[]>
  putBatch(data: IpldRecord[]): Promise<(CID | null)[]>
  getParsed<T>(cid: CID, parse: ParseFnOrObj<T>): Promise<T>
}

export abstract class IpldBlockStoreBase implements IpldBlockStore {
  abstract putBytes(cid: CID, bytes: Uint8Array): Promise<void>
  abstract getBytes(cid: CID): Promise<Uint8Array>
  abstract hasCid(cid: CID): Promise<boolean>

  parse(bytes: Uint8Array | Buffer) {
    const decoded = codec.decode(bytes)
    const value = postDecode(decoded as any as IpldRecord)
    return value
  }

  async put(record: any): Promise<CID> {
    const value = preEncode(record)
    const block = await Block.encode({ value, hasher, codec })
    await this.putBytes(block.cid, block.bytes)
    return block.cid
  }

  async get(cid: CID): Promise<IpldRecord> {
    const bytes = await this.getBytes(cid)
    return this.parse(bytes)
  }

  async has(cid: CID): Promise<boolean> {
    return this.hasCid(cid)
  }

  async putBatch(data: IpldRecord[]): Promise<CID[]> {
    return Promise.all(
      data.map(async (record) => {
        return this.put(record)
      }),
    )
  }

  async getBatch(cids: CID[]): Promise<(IpldRecord | null)[]> {
    return Promise.all(
      cids.map(async (cid) => {
        return this.get(cid).catch(() => null)
      }),
    )
  }

  async getParsed<T>(cid: CID, parse: ParseFnOrObj<T>): Promise<T> {
    const value = await this.get(cid)
    let parser
    if (typeof parse === 'function') parser = parse
    else parser = parse.parse
    return parser(value)
  }
}

export class PrimsaIpldBlockStore
  extends IpldBlockStoreBase
  implements IpldBlockStore
{
  constructor(private prisma: PrismaClient) {
    super()
  }

  async putBytes(cid: CID, bytes: Uint8Array): Promise<void> {
    this.prisma.block.create({
      data: {
        cid: cid.toString(),
        bytes: Buffer.from(bytes),
        // len: bytes.length,
      },
    })
  }

  async getBytes(cid: CID): Promise<Uint8Array> {
    const data = await this.prisma.block.findUnique({
      where: { cid: cid.toString() },
      select: { bytes: true },
    })
    if (!data) throw new Error('not found')
    return data.bytes
  }

  async hasCid(cid: CID): Promise<boolean> {
    const count = await this.prisma.block.count({
      where: { cid: cid.toString() },
    })
    return count === 1
  }
}

const ISO_DATE_REGEX = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/

type IpldScalar = string | number | CID | Uint8Array | null
interface IpldRecord {
  [k: string]: IpldValue
}
type IpldArray = IpldValue[]
export type IpldValue = IpldRecord | IpldScalar | IpldArray

interface ParseFn<T> {
  (data: any): T
}
interface ParseObj<T> {
  parse: ParseFn<T>
}
type ParseFnOrObj<T> = ParseFn<T> | ParseObj<T>

function preEncode(value: any): IpldValue {
  const map = (value: any) => {
    if (value instanceof Date) return value.toISOString()
    if (value === undefined || value === null) return null
    return walker(map, value)
  }
  return map(value)
}

function postDecode(value: IpldValue): any {
  const map = (value: any) => {
    if (typeof value === 'string') {
      if (ISO_DATE_REGEX.test(value)) {
        const date = new Date(value)
        if (date.toISOString() === value) return date
      }
    }
    return walker(map, value)
  }
  return map(value)
}

function walker(map: (value: any) => any, value: any): any {
  if (value instanceof Set) return walker(map, Array.from(value.entries()))
  if (value instanceof Map)
    return walker(map, Object.fromEntries(value.entries()))
  if (Array.isArray(value)) return value.map(map)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, map(v)]),
      // not needed because cborg already sorts
      // .sort((a, b) => (a[0] > b[0] ? 1 : -1)
    )
  }
  return value
}
