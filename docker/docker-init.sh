#!/bin/sh

set -e

# wait for docker to be ready
# cat <<EOF | node
# const exit = msg => (console.log('Error: ' + msg) || process.exit(1))
# const url = new URL(process.env.DATABASE_URL)
# if (url.protocol !== 'postgresql:') exit('DATABASE_URL must start with "postgresql:"')
#
# console.log(url)
# process.exit(1)
# EOF

yarn migrate
yarn server
