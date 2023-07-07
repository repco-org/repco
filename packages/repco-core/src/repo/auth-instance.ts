import * as ucans from '@ucans/ucans'
import * as uint8arrays from 'uint8arrays'
import type { Prisma } from 'repco-prisma'
import { KeypairScope } from 'repco-prisma'
import { delegatePublishingCapability } from './auth.js'
import { createCID } from './blockstore.js'
import { ErrorCode, RepoError } from '../repo.js'

const REPO_SCOPE = 'repco/repo'

let INSTANCE_KEYPAIR: ucans.EdKeypair | null = null

export async function getPublishingUcanForInstance(
  prisma: Prisma.TransactionClient,
  repoDid: string,
) {
  const instanceDid = await getInstanceDid(prisma)
  const where = {
    scope: REPO_SCOPE,
    audience: instanceDid,
    resource: repoDid,
  }
  const data = await prisma.ucans.findFirst({ where })
  if (data) return data.token
  else throw new Error('UCAN not found.')
}

export async function instanceSignPayload(
  prisma: Prisma.TransactionClient,
  payload: Uint8Array,
) {
  const keypair = await getInstanceKeypair(prisma)
  return keypair.sign(payload)
}

export async function delegatePublishingCapabilityToInstance(
  prisma: Prisma.TransactionClient,
  repoKeypair: ucans.EdKeypair,
) {
  const instanceDid = await getInstanceDid(prisma)
  const token = await delegatePublishingCapability(repoKeypair, instanceDid)
  const tokenBytes = uint8arrays.fromString(token)
  const cid = await createCID(tokenBytes)
  const data = {
    scope: REPO_SCOPE,
    audience: instanceDid,
    resource: repoKeypair.did(),
    token,
    cid: cid.toString(),
  }
  await prisma.ucans.create({
    data,
  })
  return token
}

export async function getInstanceDid(prisma: Prisma.TransactionClient) {
  const keypair = await getInstanceKeypair(prisma)
  return keypair.did()
}

export async function getInstanceKeypair(prisma: Prisma.TransactionClient) {
  if (!INSTANCE_KEYPAIR) {
    const name = 'root'
    const scope = KeypairScope.INSTANCE
    let keypair
    try {
      keypair = await loadKeypair(prisma, { name, scope })
    } catch (_err) {
      keypair = await createKeypair(prisma, scope, name)
    }
    INSTANCE_KEYPAIR = keypair
  }
  return INSTANCE_KEYPAIR
}

export async function createRepoKeypair(prisma: Prisma.TransactionClient) {
  const scope = KeypairScope.REPO
  const keypair = await createKeypair(prisma, scope)
  await delegatePublishingCapabilityToInstance(prisma, keypair)
  return keypair
}

export async function createKeypair(
  prisma: Prisma.TransactionClient,
  scope: KeypairScope,
  name?: string,
) {
  const keypair = await ucans.EdKeypair.create({ exportable: true })
  const did = keypair.did()
  const data = {
    did,
    secret: await keypair.export(),
    scope,
    name,
  }
  await prisma.keypair.create({
    data,
  })
  return keypair
}

export async function loadKeypair(
  prisma: Prisma.TransactionClient,
  where: Prisma.KeypairWhereInput,
) {
  const keypairData = await prisma.keypair.findFirst({
    where,
    select: { secret: true, did: true },
  })
  let keypair
  if (keypairData) {
    keypair = ucans.EdKeypair.fromSecretKey(keypairData.secret)
    if (keypair.did() !== keypairData.did) {
      throw new RepoError(
        ErrorCode.INVALID,
        `Stored secret key for DID ${keypairData.did} is invalid.`,
      )
    }
    return keypair
  }
  const name = where.did || where.name || 'unknown'
  throw new Error(`Keypair \`${name}\` not found`)
}
