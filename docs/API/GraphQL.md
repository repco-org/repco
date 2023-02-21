---
title: GraphQl API
weight: 1
---

# GraphQL API

The Repco API offers a GraphQL interface for querying data from a Repco node. This interface provides clients with a convenient and efficient way to retrieve data.
The GraphQL API is readonly and intended for public access.

The GraphQL API is exposed on the `/graphql` endpoint.

## GraphiQL

Repco bundles GraphiQL, a web UI to browse the GraphQL API schema and construct queries.

It is accessible on the `/graphiql` endpoint, so [`http://localhost:8765/graphiql`](http://localhost:8765/graphiql) in a local installation.

This will allow you to interact with the API, query data, and view the results in real-time.
