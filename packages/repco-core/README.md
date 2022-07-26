# repco-core

Core modules for a Repco node.

## Usage

`repco-core` includes a small command-line interface. For most use cases, you'd want to use `repco-core` with the HTTP gateway in [`repco-server`](../repco-server).

```
$ yarn build
$ yarn cli
Commands:
  ingest         Fetch and persist updates from datasources
  log-revisions  Load and print all revisions from the local database
  store-cursor   Store a cursor for a datasource manually
```

Use `yarn cli ingest` to ingest updates from the configured datasources. *Currently, this will only fetch updates from [cba.media](https://cba.media).*

