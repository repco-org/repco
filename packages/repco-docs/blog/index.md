---
slug: welcome
title: Welcome
authors: [arso]
tags: [ECB, Welcome, Repco]
---

The project ‘European Cultural Backbone 2.0’ (ECB2.0) aspires to launch a digital infrastructure in the form of a federated system where cross-European nodes of broadcasting services, disseminators of audiovisual content, and media outlets collaboratively participate on a federated platform. European Cultural Backbone 2.0 envisages a decentralized network that facilitates the exchange of content, metadata and audiences between nodes. The open source software package that will make this federation possible will be called REPCO, short for ‘replication & collection’.

Repco deals with repositories of Community Media. Community Media is defined as media (audio, video, pictures) that are produced by community-based, mostly non-commercial media creators. This includes Community Radio stations, recordings of events and lectures, podcasters and other media collections.

## This is work in progress

The repco codebase exposes a command-line interface and a data server. It allows to import content from different data sources into a Repco node, and enables replication of this content between different repco nodes.

All data that is imported into a repco node is enriched with signatures to allow full self-authentication. The data is organized into repositorie, encoded as IPLD and addressable via IPFS content IDs.

The actual domain data is easily accessible via a GraphQL API, making it straightforward to build different font-ends to display and browse the content repositories. These APIs are used in our front-end prototype, which provides an easy-to-use web user interface to browse the content of a repco node. The front-end also offers a feature to create playlists of content, intended as a first step towards higher-level curation features for repco.

The full source code of repco is published on GitHub. The README provides instructions on how to install and run a repco node.

A first set of public nodes will be launched soon once a final round of bugs is fixed and the deployment setup received some more tests.
