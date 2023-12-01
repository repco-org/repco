import * as schema from './ap/schema.js'
import { randomBytes } from 'crypto'
import { EventEmitter } from 'events'
import { Prisma, PrismaClient } from 'repco-prisma'
import {
  generateRsaKeypairPem,
  Keypair,
  Parser,
  SignOpts,
} from './ap/crypto.js'
import { fetchAp } from './ap/fetch.js'
import { ApiError } from './error.js'

const CTX = '@context'

export const CONTEXTS = {
  activitystreams: 'https://www.w3.org/ns/activitystreams',
  security: 'https://w3id.org/security/v1',
}

const extractId = (object: schema.ObjectOrId): string =>
  typeof object === 'string' ? object : object.id

type LocalActorDb = {
  name: string
  keypair: Keypair
}

export type LocalActor = LocalActorDb & {
  actor: ReturnType<typeof actorRecord>
}

export class ActivityPub extends EventEmitter {
  public db: PrismaClient
  public domain: string
  public baseUrl: URL
  remoteActorKeys: Record<string, any> = {}

  constructor(db: PrismaClient, baseUrl: string | URL) {
    super()
    this.db = db
    this.baseUrl = new URL(baseUrl)
    this.domain = this.baseUrl.host
  }

  async getOrCreateActor(name: string): Promise<LocalActor> {
    try {
      return await this.getActor(name)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return await this.createActor(name)
      } else {
        throw err
      }
    }
  }

  async getActor(name: string): Promise<LocalActor> {
    const data = await this.db.apLocalActor.findUnique({
      where: { name },
    })
    if (!data) throw new ApiError(404, 'Actor unknown: ' + name)
    const keypair = data.keypair as Keypair
    const actor = actorRecord(this.baseUrl, data.name, keypair.publicKeyPem)
    return {
      name: data.name,
      keypair,
      actor,
    }
  }

  async createActor(name: string): Promise<LocalActor> {
    if (await this.db.apLocalActor.findUnique({ where: { name } })) {
      throw new ApiError(400, 'Actor exists')
    }
    const keypair = generateRsaKeypairPem()
    const data = { name, keypair }
    await this.db.apLocalActor.create({ data })
    const actor = actorRecord(this.baseUrl, data.name, keypair.publicKeyPem)
    return {
      name: data.name,
      keypair,
      actor,
    }
  }

  // get the actor ids of the actors that this local actor follows
  async getFollows(localName: string): Promise<string[]> {
    const followed = await this.db.apFollows.findMany({
      where: { localName },
    })
    const actorIds = followed.map((r) => r.remoteId)
    return actorIds
  }

  // get the messages of all actors that this local actor follows
  async getActivitiesForLocalActor(
    localName: string,
    since?: string,
  ): Promise<schema.Activity[]> {
    const actorIds = await this.getFollows(localName)
    if (!actorIds.length) return []
    const where: Prisma.ApActivitiesWhereInput = { actorId: { in: actorIds } }
    if (since) {
      const fromDate = new Date(since)
      where.receivedAt = { gt: fromDate }
    }
    const rows = await this.db.apActivities.findMany({
      where,
      orderBy: { receivedAt: 'asc' },
    })
    return rows.map((row) => row.details as any as schema.Activity)
  }

  async getActivitiesForRemoteActor(
    actorId: string,
    fromDate?: Date,
  ): Promise<schema.Activity[]> {
    const where: Prisma.ApActivitiesWhereInput = { attributedTo: { has: actorId }}
    if (fromDate) {
      where.receivedAt = { gt: fromDate }
    }
    const rows = await this.db.apActivities.findMany({
      where,
      orderBy: { receivedAt: 'asc' },
    })
    return rows.map((row) => row.details as any as schema.Activity)
  }

  async listActors() {
    const data = await this.db.apLocalActor.findMany()
    return data.map((row) => row.name)
  }

  /**
   * follow a remote actor
   *
   * returns the remote actor id
   */
  async followRemoteActor(localName: string, remoteHandle: string) {
    const local = await this.getActor(localName)
    const remote = await fetchActorFromWebfinger(remoteHandle)

    const existingFollows = await this.getFollows(localName)
    if (existingFollows.indexOf(remote.id) !== -1) {
      return remote.id
    }

    const guid = randomBytes(16).toString('hex')
    const message = {
      [CTX]: CONTEXTS.activitystreams,
      id: `${local.actor.id}/follows/${guid}`,
      type: 'Follow',
      actor: local.actor.id,
      object: remote.id,
    }
    await this.send(local, remote, message)
    const data = {
      localName,
      remoteId: remote.id,
    }
    await this.db.apFollows.upsert({
      create: data,
      update: data,
      where: { localName_remoteId: data },
    })
    this.emit('follow', localName, remote.id)
    return remote.id
  }

  async send(from: LocalActor, target: schema.Actor, data: any) {
    if (!target || !target.id) {
      throw new ApiError(
        400,
        'cannot send message: invalid actor object ' + JSON.stringify(target),
      )
    }
    const inbox = target.sharedInbox || target.inbox
    if (!inbox) {
      throw new ApiError(400, 'missing inbox in actor object for ' + target.id)
    }
    const res = await fetchAp(inbox, {
      data,
      method: 'POST',
      sign: {
        privateKeyPem: from.keypair.privateKeyPem,
        publicKeyId: from.actor.publicKey.id,
      },
    })
    return res
  }

  async verifyAndPostInbox(body: any, reqParams: SignOpts) {
    try {
      await this.verifySignature(reqParams)
      await this.postInbox(body)
    } catch (err) {
      console.error('failed to process inbox post', err)
      throw err
    }
  }

  async verifySignature(signOpts: SignOpts) {
    // TODO: verify digest signature
    const signature = new Parser().parse(signOpts)
    const publicKey = await this.getRemotePublicKey(signature.keyId)
    const success = signature.verify(publicKey.publicKeyPem)

    if (!success) {
      throw new ApiError(403, 'http signature validation failed')
    } else {
      return publicKey.owner
    }
  }

  async getRemotePublicKey(keyId: string): Promise<any> {
    if (!this.remoteActorKeys[keyId]) {
      const keyRes = await fetchAp(keyId)
      if (!keyRes.publicKey) {
        return new ApiError(400, `Failed to fetch public key for ${keyId}`)
      }
      const { publicKey } = keyRes
      this.remoteActorKeys[keyId] = publicKey
    }
    return this.remoteActorKeys[keyId]
  }

  async fetchObject(objectOrId: schema.ObjectOrId): Promise<schema.Object> {
    if (typeof objectOrId === 'object') {
      return objectOrId
    } else {
      const obj = await fetchAp(objectOrId)
      return schema.object.parse(obj)
    }
  }

  async postInbox(input: any) {
    const activity = schema.activity.parse(input)
    const object = await this.fetchObject(activity.object)
    const objectId = object.id
    const attributedTo: string[] = []
    if (object.attributedTo) {
      for (const attr of object.attributedTo) {
        attributedTo.push(extractId(attr))
      }
    }
    if (attributedTo.indexOf(activity.actor) === -1) {
      attributedTo.push(activity.actor)
    }
    const data = {
      id: activity.id,
      actorId: activity.actor,
      type: activity.type,
      details: activity as any,
      objectId: objectId,
      receivedAt: new Date(),
      attributedTo,
    }
    const where = { id: activity.id }
    await this.db.apActivities.upsert({ create: data, update: data, where })
    this.emit('update', activity.actor, activity)
  }

  async getWebfingerRecord(name: string) {
    // this throws if the actor does not exist
    await this.getActor(name)
    const url = this.baseUrl + '/u/' + name
    return webfingerRecord(url, this.domain, name)
  }

  async getActorRecord(name: string) {
    const actor = await this.getActor(name)
    return actorRecord(this.baseUrl, actor.name, actor.keypair.publicKeyPem)
  }
}

function webfingerRecord(url: URL | string, domain: string, username: string) {
  return {
    subject: `acct:${username}@${domain}`,
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: url.toString(),
      },
    ],
  }
}

function actorRecord(url: URL | string, name: string, publicKeyPem: string) {
  return {
    ...contexts(),
    id: `${url}/u/${name}`,
    type: 'Person',
    preferredUsername: `${name}`,
    inbox: `${url}/inbox`,
    endpoints: {
      sharedInbox: `${url}/inbox`,
    },
    outbox: `${url}/u/${name}/outbox`,
    followers: `${url}/u/${name}/followers`,
    publicKey: {
      id: `${url}/u/${name}#main-key`,
      owner: `${url}/u/${name}`,
      publicKeyPem,
    },
  }
}

export type HasContext = {
  [CTX]: string[]
}

export function contexts(): HasContext {
  return {
    [CTX]: [CONTEXTS.activitystreams, CONTEXTS.security],
  }
}

async function fetchActorFromWebfinger(handle: string): Promise<schema.Actor> {
  const webfinger = await fetchWebfinger(handle)

  const link = webfinger.links.find((link) => link.rel === 'self')
  if (!link || !link.href) throw new ApiError(400, 'No self link in Webfinger')

  const actor = await fetchAp(link.href)
  return schema.actor.parse(actor)
}

async function fetchWebfinger(handle: string): Promise<schema.Webfinger> {
  const url = parseHandle(handle)
  const data = await fetchAp(url)
  return schema.webfinger.parse(data)
}

function parseHandle(handle: string): string {
  const match = handle.match(/^@?([^@]+)@(.+)$/)
  if (!match) {
    throw new ApiError(400, 'Invalid handle format')
  }
  const username = match[1]
  let domain = match[2]
  let url = domain
  if (domain.startsWith('http://')) {
    domain = domain.replace('http://', '')
  } else if (domain.startsWith('https://')) {
    domain = domain.replace('https://', '')
  } else {
    url = 'https://' + domain
  }
  url += `/.well-known/webfinger?resource=acct:${username}@${domain}`
  return url
}
