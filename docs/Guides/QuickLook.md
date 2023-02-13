---
title: Quick Look
weight: 0
---

---
title: Packages and modules
---

# Quick Look

repco is a collection of packages and modules that work together to provide a digital infrastructure for a federated system. In this section, you'll find a brief overview of each package and what it's responsible for.

## repco-cli
The repco-cli package provides the Command Line Interface (CLI) for repco. This package allows you to interact with repco using a terminal, making it easier to manage and configure your data sources.

## repco-common
The repco-common package adds custom types to the zod validation library and provides a logger. The custom types are used to validate the data inputs, while the logger is used to track errors and log messages.

## repco-core
The repco-core package contains the main logic of repco and provides corresponding functions. In this package, you'll find implementations for different data sources such as CBA, XRCB, and FRN. These data sources use different APIs (such as WP APIs and RSS feeds) to fetch data.

## repco-docs-website
The repco-docs-website package provides the documentation folder as a website, making it easy to access and read through the documentation.

## repco-frontend
The repco-frontend package includes a simple frontend that allows you to visualize the ContentItems and create playlists. It's created using technologies such as Remix, Tailwind CSS, CVA, URQL, and Radix-UI. It uses the GraphQL interface of repco to access the data.

## repco-graphql
The repco-graphql package generates the GraphQL API for the RDDM (Repco Data Definition Model) using PostGraphile. The GraphQL API is used for read-only access and cannot be used to publish content. Currently, it's only used in the frontend.

## repco-prisma
The repco-prisma package includes the Prisma library and defines the Prisma schema for the data model used by repco, which is divided into RDDM and RLDM (Repco Logical Data Model).

## repco-prisma-generate
The repco-prisma-generate package generates functions and types from the Prisma schema, which are used to handle relationships and validate the types using the Zod library.

## repco-server
The repco-server package provides an Express server for the REST API and a handler for the GraphQL API.

## repco-webcomponent
The repco-webcomponent package provides a web component for repco, which can be used as a recommendation box. This makes it easy to integrate repco into your website or application.
