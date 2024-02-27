// @ts-ignore
import 'express-async-errors'
import * as routes from './routes.js'
import express from 'express'
import { createLogger } from 'repco-common'
import { ActivityPub } from './ap.js'
import { ApiError } from './error.js'
import { PeertubeClient } from './util/peertube.js'

export { ActivityPub } from './ap.js'
export { PeertubeClient } from './util/peertube.js'

export const logger = createLogger('ap')

export interface ActivityPubOpts {
  prefix: string
  api?: ApiOpts
}

export const DEFAULT_OPTS: ActivityPubOpts = {
  prefix: '/ap',
}

export interface ApiOpts {
  prefix: string
  auth: (req: express.Request) => Promise<boolean>
}

/**
 * Get activitypub state from request
 */
export function state(req: express.Request) {
  return req.app.locals.activitypub as ActivityPub
}

let ap: undefined | ActivityPub = undefined

/**
 * Set a global instance. Can be retrieved via [`getGlobalApInstance`]
 */
export function setGlobalApInstance(instance: ActivityPub) {
  ap = instance
}

/**
 * Get the global instance set via [`setGlobalApInstance`].
 */
export function getGlobalApInstance(): ActivityPub | undefined {
  return ap
}

/**
 * Initialize the ActivityPub server
 */
export function mountActivityPub(
  app: express.Express,
  ap: ActivityPub,
  opts: ActivityPubOpts,
) {
  const { prefix, api } = opts

  // init state
  app.locals.activitypub = ap

  const notFound: express.Handler = (_req, res, next) => {
    if (res.writableEnded) next()
    else next(new ApiError(404, 'not found'))
  }

  // mount activitypub routes
  app.use(prefix, routes.activity, notFound, ApiError.handle)

  // mount api routes, if configured
  if (api) {
    const requireAuth: express.Handler = async (req, res, next) => {
      if (!(await api.auth(req))) throw new ApiError(403, 'Unauthorized')
      next()
    }
    app.use(api.prefix, requireAuth, routes.api, notFound, ApiError.handle)
  }

  // mount well-known routes
  app.get('/.well-known/nodeinfo', routes.nodeinfo, ApiError.handle)
  app.get('/.well-known/webfinger', routes.webfinger, ApiError.handle)
}
