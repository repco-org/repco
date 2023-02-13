---
title: Deploying Repco
weight: 1
---

# Deploying Repco

The easiest way to deploy Repco is using [Docker Compose](https://docs.docker.com/compose/). Until the first release, we publish [nightly images on dockerhub](https://hub.docker.com/r/arsoxyz/repco) on each push to `main`.

## Prerequisites

- [Docker](https://docs.docker.com/engine/installation/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Steps

1. Create a directory to store the Repco setup:
  ```
  mkdir repco
  ```
2. Download the `docker-compose.yml` from the [repco repository](https://github.com/openaudiosearch/repco):
  ```
  wget https://raw.githubusercontent.com/openaudiosearch/repco/main/docker/docker-compose.yml
  ```
3. Run Repco and its dependencies (PostgreSQL) using Docker Compose:
  ```
  docker compose up -d
  ```
The API and web UI will be available at `http://localhost:3000`. If you want to expose it to the public, you should place it behind a reverse proxy that handles HTTPS.

You can run the Repco command line interface with the following command:

```
docker compose exec app repco
```