# Deploying repco

The easiest way to deploy repco is via `docker` and `docker compose`.

* Create a directory on your server
* Download the latest `docker-compose.yml` file:
```
wget https://raw.githubusercontent.com/repco-org/repco/main/docker/docker-compose.yml
```
* Download the `sample.env` file and save it as `.env`:
```
wget https://raw.githubusercontent.com/repco-org/repco/main/sample.env -o .env
```
* Point a https-enabled reverse proxy to `localhost:8765`, or change the `docker-compose.yml` to include the external network where your reverse proxy runs.
* Adjust the `.env` - it is required to set the publicly reachable URL (`REPCO_URL`) and an admin token for API access (`REPCO_ADMIN_TOKEN`)
* Now start repco with `docker compose up -d`
* You can access the repco CLI with `docker compose exec app repco`
