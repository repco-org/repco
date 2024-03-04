# ActivityPub development

Repco includes a tiny ActivityPub server to ingest content from ActivityPub actors.

To locally develop and test the federation, you can start a local peertube instance. A docker compose file is included in the repo.

To launch a local PeerTube instance:

```
cd dev/peertube
docker compose up -d
```
To make federation work, add this line to `/etc/hosts`:
``` 
127.0.0.1 host.docker.internal
```

Afterwards open http://host.docker.internal:9000 in a browser and login with username `root` and password `peertube`
