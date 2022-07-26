# repco-server

A HTTP server for repco.

## Usage

```
yarn build && yarn start
```

This will start the server on `http://localhost:8765`. 

## Configuration

`repco-server` is configured through environment variables. It will also read a `.env` file on startup.

|name|default|description|
|-|-|-|
|`PORT`|`8765`|Port to bind the HTTP server to|
|`DATABASE_URL`||Database URL for the Prisma client|

## Routes

#### `GET /changes`

Fetch revisions, ordered by the revision ID (which includes a timestamp). Returns a JSON encoded array of revisions.

Query parameters:
* `from=revisionid`: Start from this revision id.
* `format=ndjson`: Render the revisions as newline-delimited JSON

#### `PUT /changes`

Store revisions. The output from `GET /changes` on one node can be piped into `PUT /changes` on another node.

Headers:
* `Content-Type: application/json`: Treat the body payload as a JSON array of revisions.
* `Content-Type: application/x-ndjson`: Treat the body payload as a newline delimited list of JSON encoded revisions.
