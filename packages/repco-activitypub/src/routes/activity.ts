import express from 'express'
import { contexts } from '../ap.js'
import { ApiError } from '../error.js'
import { state } from '../server.js'

export const routes = express.Router()

routes.use(
  express.json({ type: ['application/json', 'application/activity+json'] }),
)

routes.post('/inbox', async (req, res) => {
  const ap = state(req)
  const url = req.originalUrl
  const method = req.method

  await ap.verifyAndPostInbox(req.body, {
    url,
    method,
    headers: req.headers as Record<string, string>,
  })
  res.status(204)
  res.end()
})

routes.get('/u/:name', async (req, res) => {
  const ap = state(req)
  const record = await ap.getActorRecord(req.params.name)
  replyAp(res, record)
})

routes.get('/u/:name/followers', async (req, res) => {
  const ap = state(req)
  const id = `${ap.baseUrl}/u/${req.params.name}/followers`
  const data = {
    id,
    type: 'OrderedCollection',
    totalItems: 0,
  }
  replyAp(res, { ...contexts(), ...data })
})

// todo: return all activities from followers?
routes.get('/u/:name/outbox', async (req, res) => {
  const ap = state(req)
  const id = `${ap.baseUrl}/u/${req.params.name}/outbox`
  const data = {
    id,
    type: 'OrderedCollection',
    totalItems: 0,
  }
  replyAp(res, { ...contexts(), ...data })
})

export const webfinger: express.RequestHandler = async (req, res) => {
  const ap = state(req)
  const resource = req.query.resource
  if (typeof resource !== 'string' || !resource.startsWith('acct:')) {
    throw new ApiError(400, 'Query param `resource` must start with `acct:`')
  }
  const name = resource.substring(6)
  const record = await ap.getWebfingerRecord(name)
  return res.json(record)
}

export const nodeinfo: express.RequestHandler = async (_req, _res) => {
  throw new ApiError(404, 'not implemented')
}

function replyAp(res: express.Response, data: any) {
  res.setHeader('content-type', 'application/activity+json')
  res.send(JSON.stringify(data))
}
