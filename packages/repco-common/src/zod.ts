import * as mf from 'multiformats/cid'
import { never, z } from 'zod'

export const bytes = z.union([z.instanceof(Buffer), z.instanceof(Uint8Array)])
export type Bytes = z.infer<typeof bytes>
export type Scalar = boolean | number | string
export type Json = Scalar | { [key: string]: Json } | Json[]
export const scalar = z.union([z.string(), z.number(), z.boolean()])

export const json: z.ZodSchema<Json> = z.lazy(() =>
  z.union([scalar, z.array(json), z.record(json)]),
)

export const cid = z
  .any()
  .refine((obj: unknown) => mf.CID.asCID(obj) !== null, {
    message: 'Not a CID',
  })
  .transform((obj: unknown) => mf.CID.asCID(obj) as mf.CID)

export type CID = mf.CID

export const ipldScalar = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  bytes,
  cid,
  // Dates are not part of the IPLD data models.
  // In our IPLD codec we parse ISO 8601 strings into JavaScript Date objects.
  z.date(),
  // // undefine is not allowed in IPLD. Our codec converts undefined to null.
  // z.undefined()
])
export type IpldScalar = z.infer<typeof ipldScalar>
export type Ipld = IpldScalar | { [key: string]: Ipld } | Ipld[]

export const ipld: z.ZodType<Ipld> = z.lazy(() =>
  z.union([ipldScalar, z.array(ipld), z.record(ipld)]),
)

// A typed CID is a CID with a "phantom type" attached.
export class TypedCID<T = any> extends mf.CID {
  decode(decodeFn: DecodeFn<T>, bytes: Uint8Array): T {
    return decodeFn(bytes)
  }
  // A load function. Not needed for now, but might make sense API wise.
  // async load(
  //   decodeFn: DecodeFn<T>,
  //   loadBytes: (cid: CID) => Promise<Uint8Array>,
  // ): Promise<T> {
  //   const bytes = await loadBytes(this)
  //   return this.decode(decodeFn, bytes)
  // }
}
export type DecodeFn<T> = (bytes: Uint8Array) => T

export function parseCid(str: string): CID {
  return stringCid.parse(str) as CID
}

export const did = z.string()

export type Did = z.infer<typeof did>

export const stringCid = z.string().transform((str: string, ctx) => {
  try {
    return mf.CID.parse(str)
  } catch (err) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Not a valid CID',
    })
    return never
  }
})

// todo: regex validate?
export const uid = z.string()
// export const cid = z.string()
export const uri = z.string()

export type Uid = z.infer<typeof uid>
export type Uri = z.infer<typeof uri>

export const uidLink = z.object({ uid })
export const cidLink = z.object({ cid: stringCid })
export const uriLink = z.object({ uri })

export const link = z.object({
  uid: uid.optional(),
  uri: uri.optional(),
  cid: stringCid.optional(),
})
export type Link = z.infer<typeof link>

export const revisionLink = z.object({ id: z.string() })
export type RevisionLink = z.infer<typeof revisionLink>

export type Relation = {
  uid: Uid
  type: string
  field: string
  targetType: string
  multiple: boolean
  values: Link[]
}
