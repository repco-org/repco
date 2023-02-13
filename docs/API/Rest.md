---
title: Rest
weight: -1
---

The Repco HTTP Replication API provides endpoints for ingesting and emitting streams of commits, revisions, and content using the CAR (Content Addressable Archive) format. The API includes a POST endpoint for ingestion at the path /replicationIngest, and a GET endpoint for emitting streams at the path /replication. The GET endpoint includes a from query parameter that allows the client to specify the starting point for the stream. Overall, the Repco data model and API provide a flexible and secure system for storing, managing, and accessing content and media from community media publishers. They allow for the tracking of changes to entities, and provide mechanisms for authenticating and authorizing actions within the system.
