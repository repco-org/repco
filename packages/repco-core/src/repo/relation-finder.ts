import * as common from 'repco-common/zod'
import { Prisma, repco } from 'repco-prisma'
import { GGraph, GGraphError } from './graph.js'
import { EntityInputWithHeaders } from '../entity.js'
import { parseEntities, Repo } from '../repo.js'
import { MapList } from '../util/collections.js'

export class RelationFinder {
  prisma: Prisma.TransactionClient
  counter = 0
  // map of uid -> entity
  entities: Map<string, EntityInputWithHeaders> = new Map()
  // set not yet checked entity uris
  pendingUris: Set<string> = new Set()
  // map of uri -> Relation[]
  relsByUri: MapList<common.Relation> = new MapList()
  // set of uris checked and found missing
  missingUris: Set<string> = new Set()
  // map of uri -> uid
  uriMap: Map<string, string> = new Map()

  static resolve(repo: Repo, entities: EntityInputWithHeaders[]) {
    const resolver = new RelationFinder(repo)
    resolver.pushBatch(entities)
    return resolver.resolve()
  }

  static resolveLinks(repo: Repo, links: common.Link[]) {
    const resolver = new RelationFinder(repo)
    for (const link of links) {
      resolver.pushLink(link)
    }
    return resolver.resolve()
  }

  constructor(public repo: Repo) {
    this.prisma = repo.prisma
  }

  pushLink(value: common.Link, relation?: common.Relation) {
    // TODO: Throw if uri missing?
    if (value.uid || !value.uri || this.missingUris.has(value.uri)) return
    // check if already in map: resolve now
    if (this.uriMap.has(value.uri)) {
      value.uid = this.uriMap.get(value.uri)
    } else {
      this.pendingUris.add(value.uri)
      if (relation) this.relsByUri.push(value.uri, relation)
    }
  }

  pushEntity(entity: EntityInputWithHeaders) {
    let uid = entity.uid
    if (this.entities.has(uid)) return
    this.entities.set(uid, entity)
    if (entity.headers.EntityUris) {
      for (const uri of entity.headers.EntityUris) {
        const foundUid = this.uriMap.get(uri)
        if (foundUid) {
          // if entity with the same uri already exists delete it from entities
          this.entities.delete(uid)
          uid = foundUid
          break
        }
        this.discoveredUid(uri, uid)
      }
    }
    const relations = repco.extractRelations({ ...entity, uid })
    for (const relation of relations) {
      for (const value of relation.values) {
        this.pushLink(value, relation)
      }
    }
  }

  pushBatch(entities: EntityInputWithHeaders[]) {
    entities.forEach((entity) => this.pushEntity(entity))
  }

  setLinkUid(
    entity: EntityInputWithHeaders,
    relation: common.Relation,
    uri: string,
    uid: string,
  ) {
    const { field, multiple } = relation
    const entityAny = entity as any
    if (multiple) {
      for (const link of entityAny.content[field] as common.Link[]) {
        if (link.uri === uri) link.uid = uid
      }
    } else {
      entityAny.content[field] = { uid, uri }
    }
  }

  discoveredUid(uri: string, uid: string) {
    this.uriMap.set(uri, uid)
    const relations = this.relsByUri.get(uri)
    if (!relations || !relations.length) return
    for (const relation of relations) {
      const entity = this.entities.get(relation.uid)
      if (entity) this.setLinkUid(entity, relation, uri, uid)
    }
    this.pendingUris.delete(uri)
  }

  getByUri(uri: string) {
    const uid = this.uriMap.get(uri)
    if (!uid) return
    return this.entities.get(uid)
  }

  async resolve() {
    // TODO: Max iterations
    while (this.pendingUris.size) {
      // create set of all uri relations
      // try to fetch them locally from the revision table
      const res = await this.prisma.revision.findMany({
        where: {
          entityUris: { hasSome: [...this.pendingUris] },
        },
        select: { uid: true, entityUris: true },
      })
      for (const row of res) {
        for (const uri of row.entityUris) {
          this.discoveredUid(uri, row.uid)
        }
      }

      // try to fetch them from the datasources
      const { fetched, notFound } = await this.repo.dsr.fetchEntities(
        this.repo,
        [...this.pendingUris],
      )

      notFound.forEach((uri) => {
        this.missingUris.add(uri)
        this.pendingUris.delete(uri)
      })
      const existingEntities = []
      const newEntityInputs = []
      for (const input of fetched) {
        let existing = false
        if (input.headers?.EntityUris) {
          // check if the entity was already fetched in this resolver session
          for (const uri of input.headers.EntityUris) {
            const entity = this.getByUri(uri)
            if (entity) {
              existingEntities.push(entity)
              existing = true
              break
            }
          }
        }
        if (!existing) newEntityInputs.push(input)
      }
      const newEntities = await this.repo.assignUids(
        parseEntities(newEntityInputs),
      )
      this.pushBatch([...existingEntities, ...newEntities])
    }

    // Sort the results. This also throws for ciruclar references.
    const graph = new GGraph()
    for (const entity of this.entities.values()) {
      const edges = repco
        .extractRelations(entity)
        .map((r) => r.values)
        .flat()
        .filter((x) => x.uid && this.entities.has(x.uid))
        .map((x) => x.uid) as string[]
      graph.push(entity.uid, edges)
    }
    try {
      const stack = graph.resolve()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const res = stack.map((uid) => this.entities.get(uid)!)
      return res
    } catch (err) {
      if (err instanceof GGraphError) {
        console.error('circular relation', {
          from: this.entities.get(err.id),
          edge: this.entities.get(err.edge),
        })
      }
      throw err
    }
  }
}
