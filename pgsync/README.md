# Sync data to elasticsearch

This folder contains the files needed for [pgsync](https://github.com/toluaina/). pgsync is a no-code solution for replicating data into an elastic search index.

## Prerequisites

pgsync requires logical decoding. This can be set in the `postgresql.conf` configuration file or as startup parameters in `docker-compose.yml`

```
wal_level=logical
max_replication_slots=4
```

## Configuration

A working configuration file is located at [config/schema.json](config/schema.json). This schema file should be made available to the pgsync docker container in its `/data` folder.

## Searching (using the ES server)

To search for a phrase in the elastic search index you can use the `_search` endpoint using the following example request:

```
curl --location --request GET 'localhost:9200/_search' \
--header 'Content-Type: application/json' \
--data '{
  "query": {
    "query_string": {
      "query": "wissensturm-360"
    }
  }
}'
```