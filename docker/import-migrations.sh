#!/bin/bash
source /usr/local/bin/docker-entrypoint.sh
for f in `find /docker-entrypoint-initdb.d/migrations/*/*.sql -type f`; do
  echo "import $f"
  docker_process_sql -f "$f"
done
