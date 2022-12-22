#!/bin/bash
echo "start"
source /usr/local/bin/docker-entrypoint.sh
echo "sourced"
for f in `find /docker-entrypoint-initdb.d/migrations/*/*.sql -type f`; do
  echo "process $f"
  docker_process_sql -f "$f"
done
