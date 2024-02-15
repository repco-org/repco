#!/usr/bin/env bash

wait-for-it $PG_HOST:5432 -t 60
wait-for-it $REDIS_HOST:6379 -t 60
wait-for-it $ELASTICSEARCH_HOST:9200 -t 60

jq '.[].database = env.PG_DATABASE' /data/schema.json | sponge /data/schema.json

bootstrap --config /data/schema.json
pgsync --config /data/schema.json -d -v