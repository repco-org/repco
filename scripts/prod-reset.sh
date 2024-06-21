#!/bin/bash
echo "resetting env..."
docker rm -v -f repco-app
docker rm -v -f repco-db
docker rm -v -f repco-es
docker rm -v -f repco-redis
docker rm -v -f repco-pgsync

rm -r docker/data/redis
rm -r docker/data/postgres
rm -r docker/data/elastic

git pull
docker compose -f "docker/docker-compose.build.yml" up -d --build
echo "done"