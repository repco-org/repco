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
