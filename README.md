# repco

*repco* deals with repositories of Community Media. Community Media is defined as media (audio, video, pictures) that are produced by community-based, mostly non-commercial media creators. This includes Community Radio stations, recordings of events and lectures, Podcasters and other media collections.

This repo contains both an [in-progress specification document](SPEC.md) and a first implementation of repco.

The implementation is written in TypeScript. Currently, it consists of two packages:
* [repco-prisma](./packages/repco-prisma) contains the Repco datamodel written as a [Prisma](https://www.prisma.io/) schema definition for PostgreSQL. The Prisma schema definition also emits TypeScript types for all parts of the datamodel.
* [repco-core](./packages/repco-core) is the first implementation of a Repco node that can ingest content from different data sources into a local database, replicate the content between Repco nodes and provide a public-facing API. It is a work-in-progress and not yet fully functional.

## Installation and usage

Note: These are priliminary docs for how to run Repco in a developer's setup. Docs for production deployment will come later.

First clone this repo. Then, from within the repo folder, you can run the following commands:
```sh
# install dependencies and build project
yarn && yarn build
# copy the env file. the defaults are fine for a local setup.
cp env.sample .env
# start the database server via docker compose
docker-compose up -d
# initial db migration (required)
yarn migrate
# ingest revision from cba.media
yarn cli ingest
# log the stored revisions
yarn cli log-revisions
# start the HTTP server
yarn server
# get revisions over HTTP
curl http://localhost:8765/changes
```
