import { z } from 'zod'
import { did } from './zod.js'

export const repoCreateReq = z.object({
  name: z.string(),
  gateways: z.array(z.string()).optional()
})

export type RepoCreateReq = z.infer<typeof repoCreateReq>

export const repoCreateRes = z.object({
  name: z.string(),
  did: did,
})

export type RepoCreateRes = z.infer<typeof repoCreateRes>
