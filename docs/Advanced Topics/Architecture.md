---
title: Architecture
weight: 1
---
_This document is a work in progress._

# Architecture

Here we provide a brief overview of the structure and functionality of Repco supplemented by diagrams to improve understanding.

### Datasource

The datasource is the entry point into Repco a new datasource is implemented gets the new (and old contributions) and maps them to the Repco data model which is then made available in a repository to replicate to other nodes. for more details see the docs

```mermaid
sequenceDiagram
    participant DS as Datasource
    participant Repo as Repository
    participant PRISMA as Prisma
    participant SR as SourceRecord
    participant ER as Entity
    Note over DS: Fetch Updates from the DataSource
    DS->>DS: fetchUpdates(cursor)
    DS-->>Repo: mapAndPersistSourceRecord(repo, datasource, records)
    Repo->>PRISMA: saveBatch('me', entities)
    Repo->>PRISMA: saveCursor(prisma, datasource, nextCursor)
    PRISMA-->>SR: create(sourceRecord)
    SR-->>ER: mapSourceRecord(sourceRecord)
    ER-->>Repo: entities
    Repo-->>DS: IngestResult{cursor, count}
```

### Repo

#### savebatch

```mermaid
sequenceDiagram
    participant Repo
    participant RelationFinder
    participant PrismaClient
    Repo->>Repo: $transaction()
    Repo->>RelationFinder: resolve(...)
    Repo->>Repo: saveBatchInner(...)
    Repo->>PrismaClient: createMany(...)
    PrismaClient-->>Repo: success
    Repo->>PrismaClient: commit()
    PrismaClient-->>Repo: success
```

#### saveCursor

```mermaid
sequenceDiagram
    participant Repo
    participant RelationFinder
    participant PrismaClient
    participant Cursor
    Repo->>Cursor: next()
    Cursor-->>Repo: entities
    Repo->>Repo: $transaction()
    Repo->>RelationFinder: resolve(entities)
    Repo->>Repo: saveBatchInner(entities)
    Repo->>PrismaClient: createMany(entities)
    PrismaClient-->>Repo: success
    Repo->>PrismaClient: commit()
    PrismaClient-->>Repo: success
    Repo->>Cursor: close()
```

#### saveBatchInner

```mermaid
sequenceDiagram
    participant Repo as Repo
    participant Ipld as Ipld
    participant Prisma as Prisma
    participant getInstanceKeypair as getInstanceKeypair
    participant saveFromIpld as saveFromIpld
    Repo->>getInstanceKeypair: getInstanceKeypair(prisma)
    getInstanceKeypair->>Prisma: loadKeypair(name, scope) or createKeypair(scope, name)
    getInstanceKeypair-->Repo: instanceKeypair
    Repo->>Ipld: createCommit(entities, agentKeypair, publishingCapability, opts, parentCommit)
    Ipld->>Ipld: createRevision(agentDid, entity)
    Ipld->>Ipld: create commit and root CID
    Ipld-->Repo: bundle
    Repo->>saveFromIpld: saveFromIpld(bundle)
    saveFromIpld->>Prisma: save revisions, create commit and update repo

```

### RelationFinder

```mermaid
sequenceDiagram
  participant Repo as Repo
  participant RelationFinder as RelationFinder
  participant Prisma as Prisma

  Repo->>RelationFinder: RelationFinder.resolve(repo, entities)
  RelationFinder->>RelationFinder: pushBatch(entities)
  RelationFinder->>RelationFinder: resolve()
  RelationFinder->>Prisma: prisma.findMany({where: {uri: pendingUris}})
  Prisma-->RelationFinder: entities
  RelationFinder->>RelationFinder: discoveredUid(uri, uid)
```
