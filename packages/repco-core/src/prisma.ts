import type { Prisma } from 'repco-prisma'

export * from 'repco-prisma'

export type PrismaCore = Pick<
  Prisma.TransactionClient,
  | 'agent'
  | 'block'
  | 'commit'
  | 'dataSource'
  | 'entity'
  | 'keypair'
  | 'repo'
  | 'revision'
  | 'ingestError'
>
