---
title: Deploying repco
weight: 0
---

# Deploying repco

The easiest way to deploy repco is using [Docker Compose](https://docs.docker.com/compose/).
Until the first release, we publish [nightly images on dockerhub](https://hub.docker.com/r/arsoxyz/repco) on each push to `main`.

* Install [`docker`] and [`docker-compose-plugin`]
* Create a directory:
  ```
  mkdir repco
  ```
* Download the `docker-compose.yml` from this repo:
  ```
  wget https://raw.githubusercontent.com/openaudiosearch/repco/main/docker/docker-compose.yml
  ```
* Run repco and its dependencies (PostgreSQL):
  ```
  docker compose up -d
  ```

The API and web UI will be exposed on `http://localhost:3000`. For public nodes, you'll want to put this behind a reverse proxy that handles HTTPS.

You can run the repco command line interface like this:

```
docker compose exec app repco
```
