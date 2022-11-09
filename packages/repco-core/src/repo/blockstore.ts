import * as codec from '@ipld/dag-cbor'
import * as Block from 'multiformats/block'
import * as uint8arrays from 'uint8arrays'
import { blake2b256 as hasher } from '@multiformats/blake2/blake2b'
// import { sha256 as hasher } from 'multiformats/hashes/sha2'
import { Level } from 'level'
import { CID } from 'multiformats/cid'
import { Prisma } from 'repco-prisma'

class CIDNotFoundError extends Error {
  constructor(public cid: CID) {
    super('CID not found: ' + cid.toString())
  }
}

export function parseToIpld(bytes: Uint8Array | Buffer) {
  const decoded = codec.decode(bytes)
  const value = postDecode(decoded as any as IpldRecord)
  return value
}

export function parseBytesWith<T>(
  bytes: Uint8Array,
  parseFn: ParseFnOrObj<T>,
): T {
  const value = parseToIpld(bytes)
  return parseIpldWith(value, parseFn)
}

export function parseIpldWith<T>(
  value: IpldRecord,
  parseFn: ParseFnOrObj<T>,
): T {
  let parser
  if (typeof parseFn === 'function') parser = parseFn
  else parser = parseFn.parse
  return parser(value)
}

export async function validateCID(params: { cid: CID; bytes: Uint8Array }) {
  const { cid, bytes } = params
  if (cid.multihash.code !== hasher.code) {
    throw new Error('CID hash format is unsupported')
  }
  const hash = await hasher.digest(bytes)
  if (!uint8arrays.equals(cid.multihash.bytes, hash.bytes)) {
    throw new Error('CID hash does not match bytes')
  }
}

export type BlockT = { cid: CID, bytes: Uint8Array }

export interface IpldBlockStore {
  put(data: any): Promise<CID>
  getBytes(cid: CID): Promise<Uint8Array>
  putBytes(cid: CID, bytes: Uint8Array): Promise<void>
  putBytesBatch(blocks: BlockT[]): Promise<void>
  get(cid: CID): Promise<IpldRecord>
  parse(bytes: Uint8Array | Buffer): IpldRecord
  has(cid: CID): Promise<boolean>
  getBatch(cids: CID[]): Promise<(IpldRecord | null)[]>
  putBatch(data: IpldRecord[]): Promise<(CID | null)[]>
  getParsed<T>(cid: CID, parse: ParseFnOrObj<T>): Promise<T>
  transaction(): IpldBlockStore
  commit(): Promise<IpldBlockStore>
}

export abstract class IpldBlockStoreBase implements IpldBlockStore {
  abstract putBytes(cid: CID, bytes: Uint8Array): Promise<void>
  abstract getBytes(cid: CID): Promise<Uint8Array>
  abstract hasCid(cid: CID): Promise<boolean>

  async putBytesBatch(blocks: BlockT[]) {
    await Promise.all(blocks.map(block => this.putBytes(block.cid, block.bytes)))
  }

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
    return parseIpldWith(value, parse)
  }

  transaction(): IpldBlockStore {
    return this
  }

  async commit(): Promise<IpldBlockStore> {
    return this
  }
}

export class PrismaIpldBlockStoreTransaction
  extends IpldBlockStoreBase
  implements IpldBlockStore {
  batch: Record<string, Uint8Array> = {}
  constructor(private prisma: Prisma.TransactionClient) {
    super()
  }

  async putBytes(cid: CID, bytes: Uint8Array): Promise<void> {
    const cidStr = cid.toString()
    this.batch[cidStr] = bytes
  }

  async putBytesBatch(blocks: BlockT[]) {
    for (const block of blocks) {
      this.batch[block.cid.toString()] = block.bytes
    }
  }

  async getBytes(cid: CID): Promise<Uint8Array> {
    const cidStr = cid.toString()
    if (this.batch[cidStr]) return this.batch[cidStr]
    const data = await this.prisma.block.findUnique({
      where: { cid: cid.toString() },
      select: { bytes: true },
    })
    if (!data) throw new Error('not found')
    return data.bytes
  }

  async hasCid(cid: CID): Promise<boolean> {
    const cidStr = cid.toString()
    if (this.batch[cidStr]) return true
    const count = await this.prisma.block.count({
      where: { cid: cidStr },
    })
    return count === 1
  }

  async commit(): Promise<IpldBlockStore> {
    const existing = new Set(
      await this.prisma.block
        .findMany({
          where: { cid: { in: Object.keys(this.batch) } },
          select: { cid: true },
        })
        .then((list) => list.map((x) => x.cid)),
    )

    const data = Object.entries(this.batch)
      .filter(([cid, _bytes]) => !existing.has(cid))
      .map(([cid, bytes]) => {
        return { cid, bytes: Buffer.from(bytes) }
      })

    // console.log('batch', Object.keys(this.batch).length)
    // console.log('existing', existing.size)
    // console.log(
    //   'data',
    //   data.map((x) => x.cid).length,
    // )

    await this.prisma.block.createMany({
      data,
    })
    return new PrismaIpldBlockStore(this.prisma)
  }

  transaction(): IpldBlockStore {
    throw new Error('transaction may not be nested')
  }
}

export class PrismaIpldBlockStore
  extends IpldBlockStoreBase
  implements IpldBlockStore {
  constructor(private prisma: Prisma.TransactionClient) {
    super()
  }

  transaction(): IpldBlockStore {
    return new PrismaIpldBlockStoreTransaction(this.prisma)
  }

  async putBytes(cid: CID, bytes: Uint8Array): Promise<void> {
    try {
      await this.prisma.block.create({
        data: {
          cid: cid.toString(),
          bytes: Buffer.from(bytes),
          // len: bytes.length,
        },
      })
    } catch (err) {
      // P2002: Unique constraint failed
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        // block exists: do nothing.
      } else {
        throw err
      }
    }
  }

  async putBytesBatch(blocks: BlockT[]) {
    const tx = this.transaction()
    await tx.putBytesBatch(blocks)
    await tx.commit()
  }

  async getBytes(cid: CID): Promise<Uint8Array> {
    const data = await this.prisma.block.findUnique({
      where: { cid: cid.toString() },
      select: { bytes: true },
    })
    if (!data) throw new CIDNotFoundError(cid)
    return data.bytes
  }

  async hasCid(cid: CID): Promise<boolean> {
    const count = await this.prisma.block.count({
      where: { cid: cid.toString() },
    })
    return count === 1
  }

  async commit() {
    return this
  }
}

export class LevelIpldBlockStore
  extends IpldBlockStoreBase
  implements IpldBlockStore {
  db: Level<Uint8Array, Uint8Array>
  opened = false
  _open?: Promise<void>

  static createTemp(did: string) {
    return new LevelIpldBlockStore('/tmp/repco/blockstore-' + did)
  }

  constructor(public readonly path: string) {
    super()
    this.db = new Level<Uint8Array, Uint8Array>(path, {
      // errorIfExists: true,
      valueEncoding: 'view',
      keyEncoding: 'view',
    })
  }

  // transaction(): IpldBlockStore {
  //   return this
  // }

  // async commit(): Promise<IpldBlockStore> {
  //   return this
  // }

  async open() {
    if (this.opened) return
    if (!this._open) this._open = this.db.open()
    await this._open
    this.opened = true
  }

  async putBytes(cid: CID, bytes: Uint8Array): Promise<void> {
    if (!this.opened) await this.open()
    await this.db.put(cid.bytes, bytes)
  }

  async getBytes(cid: CID): Promise<Uint8Array> {
    if (!this.opened) await this.open()
    try {
      const data = await this.db.get(cid.bytes)
      return data
    } catch (err) {
      if ((err as any).notFound) throw new CIDNotFoundError(cid)
      else throw err
    }
  }

  async hasCid(cid: CID): Promise<boolean> {
    if (!this.opened) await this.open()
    try {
      await this.db.get(cid.bytes)
      return true
    } catch (err) {
      return false
    }
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
    if (value instanceof CID) return value
    if (value instanceof Uint8Array) return value
    if (value instanceof Buffer) return value
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
    if (value instanceof CID) return value
    if (value instanceof Uint8Array) return value
    if (value instanceof Buffer) return value
    if (value === undefined || value === null) return null
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
