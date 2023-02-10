# REPCO v0.1.0

## Editors

* [Franz Heinzmann](https://github.com/Frando), [arso](https://arso.xyz)

## Authors

* [Franz Heinzmann](https://github.com/Frando), [arso](https://arso.xyz)

# 0. Abstract

User-Controlled Authorization Network (UCAN) is a trustless, secure, local-first, user-originated authorization and revocation scheme. It provides public-key verifiable, delegable, expressive, openly extensible [capabilities](https://en.wikipedia.org/wiki/Object-capability_model) by extending the familiar [JWT](https://datatracker.ietf.org/doc/html/rfc7519) structure. UCANs achieve public verifiability with chained certificates and [decentralized identifiers (DIDs)](https://www.w3.org/TR/did-core/). Verifiable chain compression is enabled via [content addressing](https://en.wikipedia.org/wiki/Content-addressable_storage). Being encoded with the familiar JWT, UCAN improves the familiarity and adoptability of schemes like [SPKI/SDSI](https://theworld.com/~cme/html/spki.html) for web and native application contexts. UCAN allows for the creation and discharge of authority by any agent with a DID, including traditional systems and peer-to-peer architectures beyond traditional cloud computing.

## Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

# 1. Introduction

## 1.1 Motivation

Repositories of community media.. extend..

# 2. Repco Lower Data Model (LDDM)

## 2.1 Structure

# 3. Repco HTTP APIs

## 3.1 `/sync`

The `/sync` endpoint allows to synchronize two instances of the same repository. The endpoint is permissionless on the HTTP level, as all permissions are checked via UCANs embedded in the data stream.

Content types
 etc
