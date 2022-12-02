# repco 

_This specification is currently in review and will be updated soon. Please check the doc folder for up-to-date descriptions of the data model._


This documents outlines a specification and architecture for _repco_, a framework for the exchange of community media and metadata.

## Scope

_repco_ deals with repositories of Community Media. Community Media is defined as media (audio, video, pictures) that are produced by community-based, mostly non-commercial media creators. This includes Community Radio stations, recordings of events and lectures, Podcasters and other media collections.

At the core of _repco_ is a **domain data model** to represent a number of entities that encapsulate the data of community media:

- `ContentItem`
- `ContentGrouping`
- `MediaAsset`
- `Chapter`
- `Transcript/Subtitle` (?)
- `BroadcastEvent`
- `BroadcastService`
- `Actor`
- `Contribution`
- `License`
- `ConceptGrouping`
- `Concept`

_repco_ also defines a set of **REST and/or (?) GraphQL APIs** that are implemented by _repco_ nodes to provide public access to repositories of Community Media.

_repco_ also defines a **Replication API and data model** to efficiently replicate and exchange repositories of Community Media.

_repco_ also includes a set of specification to exchange _repco_ data over other protocols, such as **ActivityPub** and **Matrix**.

Finally, _repco_ includes a reference implementation of a **data store and gateway** that indexes content from a selection of Community Media providers and makes their contents available through the _repco_ data models and APIs.

## Glossary

Definition of terms:

- Community Media
- Media Repository
- Repco Node
- Protocol Adaptor
- Domain data model
- Container data model
- Entity schema
- Canonical ID
- Alternative ID

## Keywords

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

## Identifiers

In _repco_, each entity has a primary, canonical identifier. These identifiers are called **uid**s. A uid _MUST_ be a string that is a valid URN as defined in [RFC 8141](https://datatracker.ietf.org/doc/html/rfc8141). The URN _MUST NOT_ include [r-components](https://datatracker.ietf.org/doc/html/rfc8141#section-2.3.1), [q-components](https://datatracker.ietf.org/doc/html/rfc8141#section-2.3.2) or [f-components](https://datatracker.ietf.org/doc/html/rfc8141#section-2.3.3).

If an entity has a matching, externally defined and specified URN, this URN MAY be used as the entity's uid.

If an entity does not already have a defined URN, implementations SHOULD assign a URN in the `urn:repco` namespace. The `repco` namespace is defined as followed:

`urn:repco:<DOMAIN_OF_REPO>:<DOMAIN_ID>`

`DOMAIN_OF_REPO` MUST be a valid DNS hostname owned by the publisher of the entity.

`DOMAIN_ID` can be any valid string that uniquely identifies the entity within the scope of `DOMAIN_OF_REPO`.

Examples:

`urn:repco:cba.media:episode:556557`

### Rationale / Alternatives

We need a unique ID for each entity to easily represent relations and replication across the _repco_ system. We chose URNs as the basic formats because they provide a nice balance between a human-readable format and compactness.

Discussion of Alternatives:

- URIs and URLs: URLs (or URIs, which include both URLs and URNs) provide mostly the same properties as URNs. They have the disadvantage that, other than URNs, URIs need to be URL-encoded to be part of the [Path part of a URI](https://datatracker.ietf.org/doc/html/rfc3986#section-3.3). In contrast, a URN can be part of the Path part without URL encoding. Additionally, all URLs can be adequately represented as URNs.
- UUIDs: UUIDs are fitting for most part of the system. URIs as defined here have the additional property of providing a way to identify matching data sources for this entity. This makes it possible for the _repco_ system to resolve unknown entities by their URN through the provided _repco_ data sources.

## Domain data model

Definitions of the entity types outlines above

## Container data model

Definitions of headers, IDs and other _meta_ information that encapsulates the domain data model.

Each revision of a domain entity links to a `Revision`, identified by a unique byte string (UUID). A `Revision` stores a number of headers (meta data) about the entity instance. The revision fields are independent of the domain data model type of the entity.

The sorted list of revisions of a repository forms the basis for the replication API (defined below).

- Repository
- Canonical ID (URN)
- Alternative IDs (URIs)
- DataSource
- Timestamp
- Previous Revision

Revision may be signed by their authors.

- Signature

TBD: Are entities and revisions stored in a format that uses CIDs (Content IDs)?

## HTTP APIs

Definition of the core HTTP APIs exposed by repco nodes.

## Replication API

Workflow and definition of the APIs to replicate _repco_ repositories.

## ActivityPub adaptor

Definition of how _repco_ data is encapsulated in ActivityPub.

## Matrix adaptor

Definition of how _repco_ data can be transferred over Matrix.

## Reference implementation

We are writing a reference implementation of a _repco_ node in TypeScript. This section outlines the architecture of the _repco_ node, its datastore, datasource adaptors and protocol adaptors.

---

# Conventions

This part keeps the internal conventions if you are contibuting.

## Interfaces

- Interfaces implement only public classes or methods.
- Private functions are named starting with an underscore (\_).

## Formats

For patterns and format rules we defined:

- .eslintrc
- .prettierrrc
