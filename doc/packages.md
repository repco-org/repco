# Overview of repco packages

## repco-cli

Contains the current commandline interface to control repco and provides methods to manage and administer repros and datasources.

```javascript
USAGE: repco <command> [opts] [args...]

COMMANDS:
Manage repco repositories
repo create         Create a repo
repo mirror         Mirror an existing repo
repo list           List repos
repo info           Info on a repo
repo car-import     Import a CAR file into a repo
repo car-export     Export repo to CAR file
repo log-revisions  Print all revisions as JSON

Manage datasources
ds add           Add a datasource
ds ingest        Ingest content from datasources
ds list-plugins  List datasource plugins

server   Start the repco API server Development helpers debug create-content  Create dummy content
```

## repco-common

Adds custom types to the zod validation and provides a logger.

## repco-core

Contains the whole logic of repco and provides corresponding functions for it. here are currently implemented the datasources examples can be found for [cba](https://cba.fro.at/explore), [xrcb](https://xrcb.cat/en/) with different wp apis as well as [frn](https://www.freie-radios.net/) with rss feeds

## repco-frontend

Includes a simple frontend to visualize the ContentItems and create playlists in localstorage . Created with the help of [remix](https://remix.run/), [tailwind](https://tailwindcss.com/), [cva](https://github.com/joe-bell/cva), [urql](https://formidable.com/open-source/urql/) and [radix-ui](https://www.radix-ui.com/) it uses the graphql interface of repco

## repco-graphql

Generates the graphql api for the RDDM using [PostGraphile](https://www.graphile.org/postgraphile/). The GraphQl api is equivalent to get so it cannot publish content it can only read it. It is used in the frontend so far.

## repco-prisma

Includes [prisma](https://www.prisma.io/) and defines as prisma schema the data model used by repco divided into RDDM and RLDM.

## repco-prisma-generate

This package generates functions and types from the prisma schema which are used to handle the ralations and validate the types via [zod](https://github.com/colinhacks/zod).

## repco-server

Provides an [express](https://expressjs.com/) server for the rest api and handler for the graphql api
