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

export function parseCid(str: string): CID {
  return stringCid.parse(str) as CID
}

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

export type Uid = string

export const uidLink = z.object({ uid })
export const cidLink = z.object({ cid: stringCid })
export const uriLink = z.object({ uri })

export const link = z.object({
  uid: uid.optional(),
  uri: uri.optional(),
  cid: stringCid.optional(),
})
export type Link = z.infer<typeof link>

export type Relation = {
  uid: Uid
  type: string
  field: string
  targetType: string
  multiple: boolean
  values: Link[]
}
