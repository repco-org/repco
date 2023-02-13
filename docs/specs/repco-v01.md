# Repco v0.1.0

## Editors and Authors

The "European Cultural Backbone 2.0" (ECB2.0) project is a visionary initiative that aims to establish a state-of-the-art digital infrastructure, designed to promote cross-European collaboration and integration. The project envisions the creation of a federated system where various nodes, including broadcasting services, audiovisual content disseminators, and media outlets, can work together on a single platform.

As a software development collective, Arso brings a wealth of expertise and experience to this project. With a focus on decentralized information and media preservation, Arso has a proven track record of researching and developing cutting-edge tools that can support the ECB2.0 initiative.

The ECB2.0 project will provide a platform for European media entities to collaborate, share information, and promote cultural heritage. By leveraging Arso's expertise in decentralized technology and information management, the project promises to deliver a robust and secure digital infrastructure that will support the continued growth and development of Europe's cultural and media landscape.

# 0. Abstract

The European Cultural Backbone 2.0 (ECB2.0) aims to launch a cutting-edge digital infrastructure to support cross-European collaboration in the broadcasting industry. The project will leverage the innovative Repco codebase, a software solution developed by Arso, to build a federated system where nodes of broadcasting services, disseminators of audiovisual content, and media outlets can participate in a single platform.

## Repco Codebase

The Repco codebase is a versatile and robust software solution that enables the import, preservation, and replication of information and media content. It provides a Command-Line Interface (CLI) and a data server that integrates with different data sources, allowing the user to import and enrich the content with signatures for full self-authentication.

## Data Organization and Accessibility

The imported data is organized into repositories and encoded as IPLD (InterPlanetary Linked Data) for easy accessibility and preservation. The content is addressable via IPFS (InterPlanetary File System) content IDs, making it possible to store and retrieve large amounts of data in a decentralized manner.

## GraphQL and REST API

The Repco codebase offers both a GraphQL and a REST API to interact with the content repositories and the underlying data. These APIs provide a robust and flexible way for developers to access the data stored within a Repco node, allowing for the creation of custom applications and user interfaces.

The GraphQL API is designed to provide an intuitive and flexible way of accessing the data stored within a Repco node. This API is used in the front-end prototype to provide an easy-to-use web user interface to browse the content of a Repco node. The GraphQL API supports various query and mutation operations, making it possible to retrieve, create, update and delete data within the repository.

The REST API is used for the replication between the Repco nodes, as well as for retrieving data from the repositories. The REST API provides a set of endpoints that can be used to replicate data between nodes, as well as to retrieve information about the repositories and their content. This API is designed to be efficient and scalable, allowing for smooth replication and data retrieval even in high-traffic scenarios.

In conclusion, both the GraphQL and the REST API provide a robust and flexible way of interacting with the Repco codebase and its content repositories. These APIs enable developers to create custom applications and user interfaces, and make it easy to retrieve, manage and replicate data within the system.

## Front-End Prototype

To demonstrate the capabilities of the Repco codebase, Arso has developed a front-end prototype. The prototype provides an easy-to-use web user interface that allows users to browse the content of a Repco node and create playlists of content. This feature serves as a starting point for higher-level curation features in the future.

## Conclusion

In conclusion, the Repco codebase and its integration into the ECB2.0 project will provide a powerful and flexible digital infrastructure that supports cross-European collaboration in the broadcasting industry. The easy-to-use GraphQL API and front-end prototype make it possible for developers to build custom applications that leverage the vast repository of information and media content stored on the platform.

## Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

# Tabel of Content

- [1. Introduction](#1-introduction)
- - [1.1 Motivation or the need for Repco](#1.1-Motivation-or-the-need-for-Repco)
- - [1.2 Overview](#1.2-Overview)
- - [1.3 Dependencies](#1.3-Dependencies)
- [2. Repco Repositories or Repo](#2-repco-repositories-or-repo)
- - [2.1 Structure of a Repository](#Structure-of-a-Repository)
- - [2.2 Commits](#Commits)
- - [2.3 Revisions](#Revisions)
- - [2.4 Keys and Signatures](#Keys-and-Signatures)
- - [2.5 Synchronization and Import/Export](#Synchronization-and-Import/Export)
- - [2.6 Conclusion](#Conclusion-1)
- [3. Repco HTTP API](#3-repco-http-api)
- - [3.1 `/sync`](#3.1-sync)
- - [3.2 `/changes`](#3.2-changes)
- [4. Repco GraphQL API](#4-repco-graphql-api)
- [5. Changes](#5-changes)
- [6. Glossary](#6-glossary)

# 1. Introduction

The Repco codebase exposes a command-line interface and a data server that enables import of content from different sources into a Repco node, as well as replication of this content between different Repco nodes. All data imported into a Repco node is enriched with signatures for full self-authentication and organized into repositories, encoded as IPLD and addressable via IPFS content IDs.

By leveraging this digital infrastructure, the European Cultural Backbone 2.0 (ECB2.0) project aspires to create a single platform for cross-European nodes of broadcasting services, disseminators of audiovisual content, and media outlets to collaborate on. The Repco codebase will provide the backbone for this initiative, offering a secure, decentralized platform for the preservation and exploration of information and media.

This specification chapter provides an overview of the Repco codebase and its key features, including the GraphQL and REST APIs, and their functionalities. It serves as a comprehensive guide for developers and users alike, providing detailed technical information on how to use the Repco codebase and the tools it provides.

## 1.1 Motivation or the need for Repco

A significant part of public debate takes place today on a few commercial online platforms, whereby the conditions and forms of free expression are made dependent solely on a market-based logic and on the commercial business models of the platform operators.

Since no real democratic discourse can take place under such conditions, it is necessary to create independent, not-for-profit infrastructures and democratic media spaces (“Public Open Spaces”) that enable and promote public debates and opinion-forming under conditions geared to the common good.

The Repco software package will provide a solution for the preservation and exploration of information and media in a way that prioritizes diversity, openness, transparency, accountability, competition, and individual rights. This platform will enable the creation of Public Open Spaces where public debates and opinion-forming can take place in a democratic and inclusive manner.

The Repco codebase is designed to be flexible, easily accessible, and secure, providing a solid foundation for developers to create custom applications and promote public discourse. By using the latest in blockchain and peer-to-peer technology, Repco will ensure the transparency, accountability, and authenticity of the content and data stored on the platform.

## 1.2 Overview

The Repco system is composed of several packages and modules, each serving a specific purpose in the overall functioning of the system. The following section provides a detailed overview of each component in the Repco architecture.

### repco-cli

The repco-cli component is responsible for providing the Command Line Interface (CLI) for Repco. This component enables interaction with Repco using a terminal, making it easier to manage and configure data sources.

### repco-common

The repco-common component extends the functionality of the zod validation library with custom types and provides a logger. The custom types are used to validate the data inputs, while the logger is used to track and log errors.

### repco-core

The repco-core component contains the main logic of Repco and provides the corresponding functions. This component implements different data sources, including CBA, XRCB, and FRN, and fetches data from APIs such as WP APIs and RSS feeds.

### repco-docs-website

The repco-docs-website component provides the documentation folder as a website, making it convenient and easy to access the documentation.

### repco-frontend

The repco-frontend component includes a simple frontend that allows for visualization of ContentItems and creation of playlists. This component was developed using technologies such as Remix, Tailwind CSS, CVA, URQL, and Radix-UI, and uses the GraphQL interface of Repco to access data.

### repco-graphql

The repco-graphql component generates the GraphQL API for the RDDM (Repco Domain Data Model) using PostGraphile. The GraphQL API is read-only and cannot be used for publishing content. Currently, it is only used in the frontend.

### repco-prisma

The repco-prisma component includes the Prisma library and defines the Prisma schema for the data model used by Repco, which is divided into RDDM and RLDM (Repco Lower Data Model).

### repco-prisma-generate

The repco-prisma-generate component generates functions and types from the Prisma schema and uses the Zod library to handle relationships and validate types.

### repco-server

The repco-server component provides an Express server for the REST API and a handler for the GraphQL API.

### repco-webcomponent

The repco-webcomponent component provides a web component for Repco, which can be used as a recommendation box, making it easy to integrate Repco into websites or applications.

### Conclusion

The Repco system is a collection of modules and packages that work together to provide a digital infrastructure for a federated system. The components of the Repco architecture each serve a specific purpose, from providing a Command Line Interface to generating the GraphQL API and providing a web component. The system's architecture is designed to be flexible and accessible, providing a solid foundation for developers to build custom applications and ensuring that the conditions for free expression are geared towards the common good.

## 1.3 Dependencies

Repco has several dependencies that are essential for its functionality and performance. These dependencies include:

Typescript: A statically typed programming language that is a strict syntactical superset of JavaScript.

Node: A platform for building server-side applications in JavaScript.

IPLD: A data model for linking and addressing content-based data structures in a distributed file system.

Prisma: A high-performance and flexible ORM that simplifies database workflows and provides a simple, type-safe API for your database.

Postgraphil: A GraphQL API generator for PostgreSQL.

Express: A fast and minimalistic web framework for Node.js that provides a robust set of features for web and mobile applications.

Remix: A full stack web framework that lets you focus on the user interface and work back through web standards to deliver a fast, slick, and resilient user experience. People are gonna love using your stuff.

These dependencies play an important role in the functionality and performance of Repco and allow developers to build scalable and powerful applications with ease.

# 2. Repco repositories or Repo

Repco utilizes a repository-based architecture to store and manage the digital content and its associated metadata. In this chapter, we will discuss the structure and components of a Repco repository and how they work together to provide a secure and efficient digital infrastructure.

## 2.1 Structure of a Repository

A Repco repository is a list of commits that represent a historical record of changes made to the content and metadata stored in the repository. Each commit in a repository contains a list of revisions that hold the actual content and metadata. The structure of a Repco repository is modeled as an IPLD (InterPlanetary Linked Data) merkle tree, with each block of data (content, revision, and commit) being hashed and stored with its content hash (encoded as a CID (Content Identifier)) in a block store.

## 2.2 Commits

A commit in a Repco repository is a record of changes made to the content and metadata stored in the repository. Each commit always contains the CID of its parent commit and the CIDs of the revisions that are part of the commit. The CID of each commit is signed, ensuring the authenticity and integrity of the data stored in the repository.

## 2.3 Revisions

A revision in a Repco repository is a record of a specific version of the content and metadata stored in the repository. A revision contains the CID of its content, making it possible to retrieve the content from the block store.

## 2.4 Keys and Signatures

A Repco repository is represented by a key pair that is stored in the database. The DID (Decentralized Identifier) of the public key serves as the primary ID for the repository, while the repository also has a name for local identification. Each commit in the repository is signed, ensuring the authenticity and integrity of the data stored in the repository. In the future, it will be possible to authorize other key pairs to sign updates to a repository using UCANs (Universally Composable and Decentralized Access Networks).

## 2.5 Synchronization and Import/Export

For synchronization and import/export, Repco utilizes CAR (Content Addressable Resources) streams, which contain the blocks of a repository and allow for incremental decoding and verification. This enables efficient and secure synchronization of repositories over untrusted connections or intermediaries.

## 2.6 Conclusion

In conclusion, the Repco repository is a secure and efficient way of storing and managing digital content and metadata. The use of IPLD, keys and signatures, and CAR streams ensures that the data stored in the repository is authentic, and the structure of the repository allows for efficient synchronization and import/export of data.

# 3. Repco HTTP API

The router of the express server handles different endpoints for managing Repco repositories and the content stored in them.

- The /repos endpoint returns a list of all Repco repositories.
- The /health endpoint returns a simple JSON object indicating the health of the system.
- The /sync/:repoDid endpoint retrieves the head commit of a Repco repository.
- The /sync/:repoDid/:tail? endpoint retrieves a CAR (Content Addressable ARchive) stream of a Repco repository's content. The :tail parameter is optional and is used to specify the tail commit of the repository.
- The /post/:repoDid endpoint imports content into a Repco repository from a CAR stream.
- The /changes/:repoDid endpoint retrieves a list of changes (revisions) in a Repco repository. The changes can be returned as either JSON or NDJSON (Newline-Delimited JSON), depending on the client's request.
- The /changes endpoint allows for creation of revisions in a Repco repository, but the implementation is currently commented out.

## 3.1 `/sync`

The /sync route in the given Express.js API is for synchronization of repositories between nodes. The API supports GET, HEAD and POST requests for the /sync route.

### GET Request:

The GET request allows a client to retrieve the full contents of a repository in a format known as the Content Addressable Archive (CAR) format. The API expects a repoDid parameter in the URL that specifies which repository the client is interested in, and an optional tail parameter which can be used to only retrieve revisions after a specified commit.

The GET request to the /sync/:repoDid/:tail? endpoint exports the repository as a CAR (Content-Addressable Representation) file. The CAR file can start from a specified tail commit, which is passed as a parameter in the URL (optional). The returned content-type header is set to HEADER_CAR and the response body is the CAR file stream.

### HEAD Request:

The HEAD request allows a client to check the current head commit of a repository. The API expects a repoDid parameter in the URL that specifies which repository the client is interested in. The response will include a header x-repco-head with the CID (Content Identifier) of the current head commit.

The HEAD request to the /sync/:repoDid endpoint returns the current head (i.e., the most recent commit) of the repository identified by the DID repoDid in the header x-repco-head. The response status code is set to 204 (No Content).

### POST Request:

The POST request allows a client to upload a repository in CAR format to the server. The API expects a repoDid parameter in the URL that specifies which repository the client is uploading. The contents of the repository are expected in the body of the request.

The POST request to the /sync/:repoDid endpoint imports a CAR file into the repository identified by the DID repoDid. The CAR file is passed as the request body. The response is a JSON object with the key ok and value true indicating the successful import of the CAR file.

### Example for sync

To sync a repo via bash, you can use the curl command in the terminal.

Here's an example to sync a repo:

```
curl -X POST \
  http://localhost:3000/sync/<repoDid> \
  -H 'content-type: application/octet-stream' \
  --data-binary @<path-to-car-file>

```

This command will send a POST request to the /sync/<repoDid> endpoint with a binary data of the car file specified by <path-to-car-file>.

You can also include the -v option to get more verbose output, which can be helpful in troubleshooting if you encounter any issues while syncing the repo.

Note: Replace <repoDid> with the actual DID of the repo and <path-to-car-file> with the actual path to the car file you want to sync.

## 3.2 `/changes`

The /changes route in Repco is used to make changes to an existing repository in the Repco system. The route provides a way to update the metadata and content of the repository.

## GET /changes

Retrieve a stream of changes for a specific repository.

### Parameters

- `repoDid` (required, string): The DID of the repository to retrieve changes for.
- `from` (optional, string): The ID of the revision to start retrieving changes from. If not provided, changes will start from the most recent revision.
- `content` (optional, string): If set to "true", the returned changes will include the content of the revisions. If not provided or set to "false", the returned changes will only include metadata about the revisions.

### Request

- Headers:
  - `Accept` (optional, string): The format of the response. If set to `application/x-ndjson`, the response will be in [NDJSON](http://ndjson.org) format. If not provided, the response will be in JSON format.

### Response

- Headers:
  - `Content-Type`: The format of the response. Will be set to `application/x-ndjson` if the response is in NDJSON format, or `application/json` if the response is in JSON format.
- Body: An asynchronous stream of change objects, in either JSON or NDJSON format. Each change object represents a single revision and includes the following properties:
  - `id` (string): The ID of the revision.
  - `timestamp` (string, ISO 8601 date-time format): The date and time when the revision was made.
  - `author` (object): Information about the author of the revision. Includes the following properties:
    - `id` (string): The ID of the author.
    - `name` (string): The name of the author.
    - `email` (string): The email address of the author.
  - `message` (string): The commit message associated with the revision.
  - `content` (string, Base64-encoded): The content of the revision, only included if the `content` query parameter was set to "true".

### Example get changes

Here is an example of a GET request to the /changes endpoint using curl.

```
curl "http://localhost:3000/changes/123456789?from=0&content=false&format=ndjson"

```

In this example, :repoDid is a placeholder for the actual repository ID. Replace it with the actual repository ID. REVISION_ID is also a placeholder, replace it with the actual revision ID that you want to start retrieving changes from. The content query parameter with a value of 1 specifies that the response should include the content of the revisions.

## PUT /changes

The /changes endpoint for the PUT method is used to submit revisions to the system. The endpoint requires the content-type header to be set to application/x-ndjson or application/json. The body of the request should contain the revision data in either JSON or NDJSON format.

## Request

### Headers

- `Content-Type`: Must be set to either `application/x-ndjson` or `application/json`

### Body

The body of the request should contain the revision data in either JSON or NDJSON format. The structure of the revision data depends on the implementation.

## Response

### Body

A JSON object with a single field, `ok`, which will be set to `true` to indicate that the request was successful.

### Status Code

- `200 OK`: The request was successful and the revisions were processed successfully.
- `400 Bad Request`: The `Content-Type` header was not set to either `application/x-ndjson` or `application/json`.

### Example for change

The /change route in Repco is used to make changes to an existing repository in the Repco system. The route provides a way to update the metadata and content of the repository.

Here is an example of how you can use the /change route in bash to update the metadata of a repository:

```
curl -X PUT -H "Content-Type: application/x-ndjson" -d '[{"field1": "value1", "field2": "value2"},{"field1": "value3", "field2": "value4"}]' http://localhost:3000/changes

```

This example assumes that your server is running on http://localhost:3000. The data being sent in the PUT request is in the ndjson format and contains two objects, each representing a revision with field1 and field2 as properties.

# 4. Repco GraphQL API

# 5. Changes

# 6. Glossary

## ECB2.0 (European Cultural Backbone 2.0)

A visionary initiative that aims to establish a digital infrastructure for cross-European collaboration and integration in the broadcasting industry.

## Arso

A software development collective that is bringing expertise and experience to the ECB2.0 project. With a focus on decentralized information and media preservation.

## Repco codebase

A versatile and robust software solution developed by Arso, which enables the import, preservation, and replication of information and media content.

## CLI (Command-Line Interface)

A tool provided by the Repco codebase to interact with the system.

## IPLD (InterPlanetary Linked Data)

A data format used by the Repco codebase to encode and organize imported data for easy accessibility and preservation.

## IPFS (InterPlanetary File System)

A decentralized file system that provides addressability for data stored within the Repco codebase via content IDs.

## GraphQL API

An API provided by the Repco codebase that uses a GraphQL query language and supports various query and mutation operations.

## REST API

An API provided by the Repco codebase that uses a RESTful architecture for data retrieval and replication between Repco nodes.

## Front-end prototype

A demo developed by Arso to showcase the capabilities of the Repco codebase, which provides an easy-to-use web user interface.

## RFC 2119

A document that defines the interpretation of key words used in the REPCO document such as "MUST", "MUST NOT", etc.

## Community Media

Refers to media organizations and platforms that are owned, managed and controlled by the local community, and are aimed at serving the needs and interests of the community.

## Media Repository

A digital database or storage system that contains a collection of links to media files and assets such as audio, video, images, and documents. The media repository serves as a centralized location for storing, organizing, and retrieving media metadata.

## Repco Node

A component which use the UCANs architecture and serves as a point of interaction between different components and external systems. A Repco Node can be thought of as a bridge that allows data to be exchanged between different systems and components.

## Repco Domain data model

A representation of data specific to a particular domain or application, that defines the relationships between different data elements and the constraints on their values.

## Repco Lower Data model

A data model that defines how data should be organized in containers, such as tables or arrays, and the relationships between the containers.

## Entity schema

A data model that defines the structure of a specific entity, such as a person or organization, and the relationships between its attributes.

## Canonical ID

A unique identifier for an entity, such as a person or organization, that is used to refer to the entity across different systems and contexts.

## Alternative ID

A secondary identifier for an entity, used in cases where the Canonical ID is not available or applicable. The Alternative ID allows for the entity to be referred to in different ways in different systems or contexts.
