import * as zod from 'zod'
import express from 'express'
import { ApiError } from '../error.js'
import { state } from '../server.js'

export const routes = express.Router()

routes.use(express.json())

routes.get('/actors', async (req, res) => {
  const ap = state(req)
  res.json(await ap.listActors())
})

const postActorSchema = zod
  .object({
    name: zod
      .string()
      .regex(
        /^[a-zA-Z]{1}[a-zA-Z0-9-]+$/,
        'must start with a letter and contain only letters, numbers and dashes',
      ),
  })
  .passthrough()

export type CreateLocalActor = zod.infer<typeof postActorSchema>
routes.post('/actors', async (req, res) => {
  const ap = state(req)
  const { name } = postActorSchema.parse(req.body)
  await ap.createActor(name)
  res.json({ ok: true })
})

routes.post('/actors/:name/follow', async (req, res, _next) => {
  const ap = state(req)
  if (typeof req.body.target !== 'string') {
    throw new ApiError(400, 'missing target in body')
  }
  const remoteResponse = await ap.followRemoteActor(
    req.params.name,
    req.body.target,
  )
  res.json({ ok: true, remoteResponse })
})

routes.get('/actors/:name/follow', async (req, res, _next) => {
  const ap = state(req)
  const rows = await ap.db.apFollows.findMany({
    where: { localName: req.params.name },
  })
  res.json({ data: rows })
})

routes.get('/actors/:name/updates', async (req, res, _next) => {
  const since = req.query.since
  if (since && typeof since !== 'string') {
    throw new ApiError(400, 'invalid `since` parameter')
  }
  const ap = state(req)
  const updates = await ap.getActivities(req.params.name, since)
  res.json({ data: updates })
})

// TODO: This will leak event handlers - will have to rewrite properly
// routes.get('/actors/:name/watch', async (req, res, _next) => {
//   const ap = state(req)
//   res.setHeader('content-type', 'application/ndjson')
//   const follows = await ap.getFollows(req.params.name)
//   console.log('follows', follows)
//   ap.on('follow', (localName, remoteId) => {
//     if (localName === req.params.name) follows.push(remoteId)
//     console.log('follows', follows)
//   })
//   ap.on('update', (actor, message) => {
//     console.log('update', actor, message)
//     if (follows.indexOf(actor) !== -1) {
//       res.send(JSON.stringify(message) + '\n')
//     }
//   })
// })
