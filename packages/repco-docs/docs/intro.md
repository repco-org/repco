---
sidebar_position: 1
---
# repco

_Repco_ (Repository of Community Media) is an application that deals with the collection, management and distribution of community-based media. Community media is defined as media (audio, video, pictures) that are produced by community-based, mostly non-commercial media creators. This includes Community Radio stations, recordings of events and lectures, Podcasters, and other media collections.

Goals:

* To provide a decentralized platform for community media creators to store, manage and distribute their media content.
* To enable easy replication of community media content between different Repco nodes.
* To provide a public-facing API for accessing community media content.
* To support different data sources and make it easy to add new data sources.
* To ensure the scalability and reliability of the application.
* To provide an easy-to-use interface for media creators and other stakeholders to manage their content.
* To make the application easy to deploy and maintain.
* To use state-of-the-art technologies for data storage, data access and data replication.
* To make the codebase open-source, to encourage contributions from the community and to foster further development of the application.

This repo contains both an [in-progress specification document](#) and a first implementation of repco.

The implementation is written in TypeScript. Currently, it consists of two packages:

- [repco-prisma](#) contains the Repco datamodel written as a [Prisma](https://www.prisma.io/) schema definition for PostgreSQL. The Prisma schema definition also emits TypeScript types for all parts of the datamodel.
- [repco-core](#) is the first implementation of a Repco node that can ingest content from different data sources into a local database, replicate the content between Repco nodes and provide a public-facing API. It is a work-in-progress and not yet fully functional.

## Installation and usage

Note: These are priliminary docs for how to run Repco in a developer's setup. Docs for production deployment will come later.

First clone this repo. Then, from within the repo folder, you can run the following commands:

```sh
# install dependencies and build project
yarn && yarn build
# copy the env file. the defaults are fine for a local setup.
cp sample.env .env
# start the database server via docker compose
docker-compose up -d
# initial db migration (required)
yarn migrate
# start the server [optional]
yarn server
# start the frontend [optional]
yarn frontend
# add new repo
yarn cli repo create default
# add datasource
yarn cli ds add -r <repo> <plugin-name> <endpoint>
# for example the cba plugin - need to define the api key for cba in .env file
yarn cli ds add -r default urn:repco:datasource:cba https://cba.fro.at/wp-json/wp/v2
# ingest updates from all datasources
yarn cli ds ingest
# print all revisions in a repo
yarn cli repo log-revisions <repo>
# get revisions over HTTP
curl http://localhost:8765/changes
# browse through contentItems via GUI
http://localhost:3000
```

## Development notes

### Package and repo structure

This project is structured as a monorepo of multiple TypeScript packages. We use Yarn workspaces to enable inter-project depencencies. To speed up build times, we also use [TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references.html). This is all readily setup, so you can just use `yarn build` or `yarn watch` in any of the packages and workspace dependencies will automatically be rebuilt if needed.

When adding new workspace dependencies to projects, the dependency has to be added to the references section in the `tsconfig.json` as well. A script is included to automate this process, so whenever adding new workspace packages or adding a workspace dependency to an existing package, run `yarn update-ts-references` from the workspace root.

When adding a new package, use one of the `tsconfig.json` files in any of the projects as a start.

### Codegen and migrations

We use both Prisma and Postgraphile, therefore a database instance is needed for development. Run `docker-compose up -d` in the root of this repo to run a local Postgres server. Also copy the sample env to `.env`.

After an initial `yarn build`, there is a one-stop command to create migration files and re-run all codegen for Prisma and GraphQL database schema changes:

`yarn codegen`

Run this command whenever you make changes to the database schema in `schema.prisma`.

# Documentation

While this is an in progress project may this is not the last standing.

Repco is organized as a monorepro. In the individual packages a TypeDoc documentation can be generated with `yarn docs`.
Most and most important functions, types, interfaces etc. are provided with appropriate comments. Each package usually contains a README.md with a short description. Additionally in each package a diagram folder can be created which contains a visualization of classes or processes.

The documentation is available at `yarn docs`

# Contribution

If you want to contribute, chat with us on our [Discord channel](https://discord.gg/XfUPZFH6cj).
