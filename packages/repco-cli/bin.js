#!/usr/bin/env node
import 'source-map-support/register.js'
// TODO: bundle build is broken because we now use multiple prisma clients
// (one in repco-prisma, one in repco-activitypub)
// import './dist/cli-bundle.js'
import './dist/src/bin.js'
