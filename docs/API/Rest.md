---
title: Rest
weight: 1
---
_This document is a work in progress._

# REST-API

The Repco REST API provides an interface for accessing the Repco data model through HTTP requests. It uses the express.js library to define routes and handle incoming requests.

The API offers several endpoint routes, each serving a specific purpose and handling a specific type of HTTP request. These endpoint routes are:

* /repos: This endpoint sends a JSON response that contains a list of Repo objects.

* /health: This endpoint returns a JSON object with a single property, ok, set to true.

* /sync/:repoDid: This endpoint returns the header x-repco-head set to the CID string of the head of the repo specified by :repoDid.

* /sync/:repoDid/:tail?: This endpoint returns a response with the content-type header application/vnd.ipld.car and a stream of the exported contents of the repo specified by :repoDid, starting from the CID specified by :tail.

* /sync/:repoDid: This endpoint imports the contents of a CAR file into the repo specified by :repoDid.

* /changes/:repoDid: This endpoint sends a JSON or NDJSON response that contains a list of changes in the repo specified by :repoDid.

* /changes: This endpoint handles PUT requests with a content-type header of JSON or NDJSON and ingests the revisions contained in the request body.

In addition to the Router object, the file also exports two helper functions, sendNdJson and sendNdJsonStream, for sending NDJSON responses.

The API is designed to be flexible and easy to use, making it a great choice for any system that needs to communicate with the Repco data model.
