#!/bin/sh

set -e

yarn migrate
yarn repco run
