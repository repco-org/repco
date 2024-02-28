# repco

_repco_ deals with repositories of Community Media. Community Media is defined as media (audio, video, pictures) that are produced by community-based, mostly non-commercial media creators. This includes Community Radio stations, recordings of events and lectures, Podcasters and other media collections.

This repo contains both an [in-progress specification document](SPEC.md) and a first implementation of repco. The implementation is written in TypeScript.

## Installation and usage

Note: These are priliminary docs for how to run Repco in a developer's setup. Docs for production deployment will come later.

#### Requirements

- Node.js v18+
- yarn v1 (yarn classic)
- Docker and Docker Compose

### Development setup

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
# add new repo with name default
yarn repco repo create default
# add datasource giving a config in json format
yarn repco ds add -r <repo> <plugin-name> <config>
# for example the cba plugin - need to define the api key for cba in .env file
yarn cli ds add -r default repco:datasource:cba https://cba.media/wp-json/wp/v2
# or add a peertube channel
yarn repco ds add -r default repco:datasource:activitypub '{"user":"root_channel","domain":"https://your-peertube-server.org"}'
# ingest updates from all datasources
yarn repco ds ingest
# print all revisions in a repo
yarn repco repo log-revisions <repo>
# get revisions over HTTP
curl http://localhost:8765/api/changes/<repo>
# browse through contentItems via GUI
http://localhost:3000
```

## Development notes

## Prod Deployment

```sh
# fetch changes
git pull
# check container status
docker compose -f "docker/docker-compose.build.yml" ps
# deploy docker image
docker compose -f "docker/docker-compose.build.yml" up -d --build
# create default repo
docker compose -f "docker/docker-compose.build.yml" exec app yarn repco repo create default
# add cba datasource
docker compose -f "docker/docker-compose.build.yml" exec app yarn repco ds add -r default repco:datasource:cba '{"endpoint": "https://cba.media/wp-json/wp/v2"}'
# restart app container so it runs in a loop
docker restart repco-app
```

### Logging

To enable debug output, set `LOG_LEVEL=debug` environment variable.
to enable Prisma query logging, set `QUERY_LOG=1` environment variable.

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

Repco is organized as a monorepro. In the individual packages a TypeDoc documentation can be generated with `yarn docs`.
Each package usually contains a README.md with a short description. Additionally in each package a diagram folder can be created which contains a visualization of classes or processes.

The documentation is available at `yarn docs`

# Contribution

If you want to contribute, chat with us on our [Discord channel](https://discord.gg/XfUPZFH6cj).
