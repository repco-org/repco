# ActivityPub development

Repco includes an ActivityPub server, which uses [activitypub-express](https://github.com/immers-space/activitypub-express).

To locally develop and test the federation, you can start a local peertube instance. A docker compose file is included in the repo.

To launch a local PeerTube instance:

```
cd dev/peertube
docker compose up -d
```
Afterwards open http://localhost:9000 in a browser and login with username `root` and password `peertube`

To make federation work, add this line to `/etc/hosts`:
``` 
127.0.0.1 host.docker.internal
```

And make sure that you have these two variables set in repco's `.env` file.
```
MONGODB_URL=mongodb://root:repco@localhost:27017/
AP_BASE_URL=http://host.docker.internal:8765/ap
```


```
