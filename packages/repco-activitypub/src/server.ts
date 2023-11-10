// @ts-ignore
import 'express-async-errors'
import * as routes from './routes.js'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import { createLogger } from 'repco-common'
import { ActivityPub } from './ap.js'
import { ApiError } from './error.js'

export const logger = createLogger('ap')

export interface ActivityPubOpts {
  baseUrl?: string
  prefix: string
  api?: ApiOpts
}

export const DEFAULT_OPTS: ActivityPubOpts = {
  baseUrl: process.env.AP_BASE_URL,
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

/**
 * Initialize the ActivityPub server
 */
export function initActivityPub(app: express.Express, opts: ActivityPubOpts) {
  const db = new PrismaClient()
  // assign default opts
  const { baseUrl, prefix, api } = { ...DEFAULT_OPTS, ...opts }
  if (!baseUrl) {
    throw new Error('Missing AP_BASE_URL environment variable')
  }

  // init state
  const ap = new ActivityPub(db, baseUrl)
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
