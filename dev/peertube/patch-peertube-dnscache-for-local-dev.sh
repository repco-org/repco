#!/bin/sh
docker compose exec peertube sed -i "s/dnsCache: true,/dnsCache: false,/g" /app/dist/server/helpers/requests.js
