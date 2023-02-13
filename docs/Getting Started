---
title: Getting Started
weight: 0
---

## __What is repco?__


**Repco is a digital infrastructure for a federated system** where cross-European nodes of broadcasting services, disseminators of audiovisual content, and media outlets collaboratively participate on a federated platform. 

It is aimed at facilitating the **exchange of content, metadata and audiences** between these nodes. 

Repco **deals with repositories of community media**, which is defined as media (audio, video, pictures) that are produced by community-based, mostly non-commercial media creators. This includes community radio stations, recordings of events and lectures, podcasters and other media collections.  

The Repco datamodel is written as a Prisma schema definition for PostgreSQL and the **Repco node is responsible for ingesting content from different data sources, replicating content between Repco nodes and providing a public-facing API**. 

The project started with a conference in Linz titled "Building a European Cultural Backbone". The contribution to the project is welcome and can be made through the [Discord](https://discord.gg/XfUPZFH6cj) channel.


## How does it work?

Each piece of **content in Repco has a "revision"**. Each revision is hashed, and the hash is stored together with the content in a blockstore. These revisions are then grouped together into "commits". Each commit is also hashed, and the hash of the commit block is used as the head of the repo.

The **structure of a repo** is a Merkle tree, where each commit is a node in the tree. This structure provides a simple and secure way to sync repos over untrusted connections or intermediaries. The root hash of a repo, with the contained signature and latest commit, contains the complete proof of the authenticity of the full repo.

Repco uses **CAR (Content Addressable Repository) streams to import and export data** between repos. The CAR streams contain the blocks of a repo and allow for incremental decoding and verification.

Repco also includes a **DataSource feature, which allows you to fetch updates from external sources** and convert the data into the Repco data model. To implement a DataSource, you need to create a DataSourcePlugin that implements the DataSourcePlugins interface. The DataSource has a definition consisting of a UID, name, and plugin ID, and provides methods to fetch updates, fetch data by UID, and check if a UID can be fetched.

Repco provides a c**ommand-line interface (CLI)** to control the system and manage repositories and DataSources. You can create a repo, mirror an existing repo, list repos, import and export data, and much more.

Repco also includes **a simple frontend** that allows you to visualize the content items and create playlists in local storage. The frontend uses the GraphQL interface of Repco, which is generated using PostGraphile.

In summary, Repco is a decentralized and secure repository management system that provides a simple way to store, manage, and share content across different platforms and devices.

### TLDR:

Repco is a system for managing and storing content using a distributed and decentralized data structure called an **IPLD merkle tree**. 

The system uses a **keypair as the primary identifier** for a repository, and each commit in a repository is signed to provide authenticity. 

The content of a repository can be **imported or exported using CAR streams**.

External data providers can be integrated into Repco through **datasources that are implemented as plugins**. 

The system can be **managed through a command line interface**. 

There is also a simple **frontend for visualizing and creating playlists**. 

The core logic of Repco is implemented in the repco-core module, and the **GraphQL API is generated using PostGraphile** in the repco-graphql module.


## What’s next?

The next chapter of the project involves **extending a data model (RDDM**) with proper **file storage** and implementing three storage providers with different capabilities: l**ocal roots, S3, and IPFS.** 

The data model must have the ability to store rich metadata and support version control, while providing a job queue/worker system to make it easy to extract metadata and perform data processing tasks.

Additionally, the project aims to provide support for **license handling,** with the ability to assign licenses to files and other content items. This will be coupled with a capability model (UCAN) to determine access to content based on assigned licenses and viewer capabilities.

The project also aims to implement **search and discovery features**, including facetted search, full-text search, keyword search, and the ability to query by concepts. The data model will support merging of concepts and proper support for distinct concept trees (taxonomies).

Finally, the project will focus on providing support for derived files, including version control and **automated extraction** using tools such as ffmpeg. The project will have a job server logic for workers to create derivations and manage available licenses per-repository.
