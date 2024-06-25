# Deploying repco

## Prod Deployment

```sh
# fetch changes
git pull
# check container status
docker compose -f "docker/docker-compose.build.yml" ps
# build and deploy docker image
docker compose -f "docker/docker-compose.build.yml" up -d --build
# create cba repo
docker compose -f "docker/docker-compose.build.yml" exec app yarn repco repo create cba
# add cba datasource
docker compose -f "docker/docker-compose.build.yml" exec app yarn repco ds add -r cba repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "url":"https://cba.media","name":"cba","image":"https://repco.cba.media/images/cba_logo.png","thumbnail":"https://repco.cba.media/images/cba_logo_th.png"}'
# eurozine
docker compose -f "docker/docker-compose.build.yml" exec app yarn repco ds add -r eurozine repco:datasource:transposer '{"endpoint":"https://vmwczww5w2j.c.updraftclone.com/wp-json/transposer/v1/repco", "url":"https://eurozine.com","name":"Eurozine","image":"https://repco.cba.media/images/eurozine_logo.png","thumbnail":"https://repco.cba.media/images/eurozine_logo_th.png"}'
# displayeurope
docker compose -f "docker/docker-compose.build.yml" exec app yarn repco ds add -r displayeurope repco:datasource:transposer '{"endpoint":"https://displayeurope.eu/wp-json/transposer/v1/repco", "url":"https://displayeurope.eu","name":"displayeurope.eu","image":"https://repco.cba.media/images/displayeurope_logo.png","thumbnail":"https://repco.cba.media/images/displayeurope_logo_th.png"}'
# frn
docker compose -f "docker/docker-compose.build.yml" exec app yarn repco ds add -r frn repco:datasource:rss '{"endpoint":"https://www.freie-radios.net/portal/podcast.php?rss", "url":"https://freie-radios.net","name":"Freie-Radios.net","image":"https://repco.cba.media/images/frn_logo.png","thumbnail":"https://repco.cba.media/images/frn_logo_th.png"}'
# okto
docker compose -f "docker/docker-compose.build.yml" exec app yarn repco ds add -r okto repco:datasource:rss '{"endpoint":"https://www.okto.tv/en/display-europe.rss", "url":"https://www.okto.tv/","name":"Okto.tv","image":"https://repco.cba.media/images/okto_logo.png","thumbnail":"https://repco.cba.media/images/okto_logo_th.png"}'
# displayeurope
yarn ds add -r default repco:datasource:activitypub '{"user":"unbiasthenews", "domain":"displayeurope.video"}'
# peertube arso
yarn ds add -r default repco:datasource:activitypub '{"user":"test1", "domain":"peertube.dev.arso.xyz"}'
# restart app container so it runs in a loop
docker restart repco-app
```

The easiest way to deploy repco is via `docker` and `docker compose`.

- Create a directory on your server
- Download the latest [`docker-compose.yml`](../../docker/docker-compose.yml) file:

```
wget https://raw.githubusercontent.com/repco-org/repco/main/docker/docker-compose.yml
```

- Download the [`sample.env`](../../sample.env) file and save it as `.env`:

```
wget https://raw.githubusercontent.com/repco-org/repco/main/sample.env -o .env
```

- Point a https-enabled reverse proxy to `localhost:8765`, or change the `docker-compose.yml` to include the external network where your reverse proxy runs.
- Adjust the `.env` - it is required to set the publicly reachable URL (`REPCO_URL`) and an admin token for API access (`REPCO_ADMIN_TOKEN`)
- Now start repco with `docker compose up -d`
- You can access the repco CLI with `docker compose exec app repco`

## Prod Deployment

```sh
# fetch changes
git pull
# check container status
docker compose -f "docker/docker-compose.build.yml" ps
# build and deploy docker image
docker compose -f "docker/docker-compose.build.yml" up -d --build
# create cba repo
docker compose -f "docker/docker-compose.build.yml" exec app yarn repco repo create cba
# add cba datasource
docker compose -f "docker/docker-compose.build.yml" exec app yarn repco ds add -r cba repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "url":"https://cba.media","name":"cba","image":"https://repco.cba.media/images/cba_logo.png","thumbnail":"https://repco.cba.media/images/cba_logo_th.png"}'
# eurozine
docker compose -f "docker/docker-compose.build.yml" exec app yarn repco ds add -r eurozine repco:datasource:rss '{"endpoint":"https://www.eurozine.com/feed/", "url":"https://eurozine.com","name":"Eurozine","image":"https://repco.cba.media/images/eurozine_logo.png","thumbnail":"https://repco.cba.media/images/eurozine_logo_th.png"}'
# frn
docker compose -f "docker/docker-compose.build.yml" exec app yarn repco ds add -r frn repco:datasource:rss '{"endpoint":"https://www.freie-radios.net/portal/podcast.php?rss", "url":"https://freie-radios.net","name":"Freie-Radios.net","image":"https://repco.cba.media/images/frn_logo.png","thumbnail":"https://repco.cba.media/images/frn_logo_th.png"}'
# displayeurope
yarn ds add -r default repco:datasource:activitypub '{"user":"unbiasthenews", "domain":"displayeurope.video"}'
# peertube arso
yarn ds add -r default repco:datasource:activitypub '{"user":"test1", "domain":"peertube.dev.arso.xyz"}'
# restart app container so it runs in a loop
docker restart repco-app
```
