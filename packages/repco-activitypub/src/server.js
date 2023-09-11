import Dotenv from 'dotenv'
// @ts-ignore
import ActivitypubExpress from 'activitypub-express'
// @ts-ignore
import history from 'connect-history-api-fallback'
import express from 'express'
import fs from 'fs'
import { MongoClient } from 'mongodb'
import p from 'path'
import { fileURLToPath } from 'url'

Dotenv.config()
Dotenv.config({ path: '../../.env' })

// const { version } = require('./package.json')
const {
  DOMAIN,
  KEY_PATH,
  CERT_PATH,
  CA_PATH,
  MONGODB_URL,
  DB_NAME,
  PORT_HTTP,
  ADMIN_SECRET,
  USE_ATTACHMENTS,
} = process.env

if (!MONGODB_URL) {
  throw new Error('DB_URL is required')
}

const __dirname = p.dirname(fileURLToPath(import.meta.url))
const CONTEXT = JSON.parse(
  fs
    .readFileSync(p.join(__dirname, '../contexts/context.json'))
    .toString('utf8'),
)
const ATTACHEMENTS = JSON.parse(
  fs
    .readFileSync(p.join(__dirname, '../contexts/attachements.json'))
    .toString('utf8'),
)

export const router = express.Router()
export const client = new MongoClient(MONGODB_URL)

const icon = {
  type: 'Image',
  mediaType: 'image/jpeg',
  url: `https://${DOMAIN}/f/guppe.png`,
}

const routes = {
  actor: '/u/:actor',
  object: '/o/:id',
  activity: '/s/:id',
  inbox: '/u/:actor/inbox',
  outbox: '/u/:actor/outbox',
  followers: '/u/:actor/followers',
  following: '/u/:actor/following',
  liked: '/u/:actor/liked',
  collections: '/u/:actor/c/:id',
  blocked: '/u/:actor/blocked',
  rejections: '/u/:actor/rejections',
  rejected: '/u/:actor/rejected',
  shares: '/s/:id/shares',
  likes: '/s/:id/likes',
}
const apex = ActivitypubExpress({
  name: 'repco',
  // todo: get from package.json instead
  version: '0.1',
  domain: DOMAIN,
  actorParam: 'actor',
  objectParam: 'id',
  itemsPerPage: 100,
  // delivery done in workers only in production
  offlineMode: process.env.NODE_ENV === 'production',
  context: CONTEXT,
  routes,
})

const acceptablePublicActivities = ['delete', 'update']
apex.net.inbox.post.splice(
  // just after standardizing the jsonld
  apex.net.inbox.post.indexOf(apex.net.validators.jsonld) + 1,
  0,
  function inboxLogger(req, res, next) {
    try {
      console.log(
        '%s from %s to %s',
        req.body.type,
        req.body.actor?.[0],
        req.params[apex.actorParam],
      )
    } finally {
      next()
    }
  },
  // Lots of servers are delivering inappropriate activities to Guppe, move the filtering up earlier in the process to save work
  //   function inboxFilter(req, res, next) {
  //     try {
  //       const groupIRI = apex.utils.usernameToIRI(req.params[apex.actorParam])
  //       const activityAudience = apex.audienceFromActivity(req.body)
  //       const activityType = req.body.type?.toLowerCase()
  //       const activityObject = req.body.object?.[0]
  //       if (
  //         !activityAudience.includes(groupIRI) &&
  //         activityObject !== groupIRI &&
  //         !acceptablePublicActivities.includes(activityType)
  //       ) {
  //         console.log(
  //           'Ignoring irrelevant activity sent to %s: %j',
  //           groupIRI,
  //           req.body,
  //         )
  //         return res.status(202).send('Irrelevant activity ignored')
  //       }
  //     } catch (err) {
  //       console.warn('Error performing prefilter:', err)
  //     }
  //     next()
  //   },
)
// Do not boost posts from servers who abuse the service.
// apex.net.inbox.post.splice(
//   // Blocked domain check is inserted into apex inbox route right after the sender is verified
//   apex.net.inbox.post.indexOf(apex.net.security.verifySignature) + 1,
//   0,
//   async function rejectBlockedDomains(req, res, next) {
//     try {
//       const url = new URL(res.locals.apex.sender.id)
//       const domain = await req.app.locals.apex.store.db
//         .collection('servers')
//         .findOne({
//           hostname: url.hostname,
//         })
//       if (domain?.blocked) {
//         console.log(`Ignoring post from ${url}:`, req.body)
//         return res.sendStatus(200)
//       }
//     } catch (err) {
//       console.error('Error checking domain blocks:', err)
//     }
//     next()
//   },
// )

// define routes using prepacakged middleware collections
router.route(routes.inbox).post(apex.net.inbox.post).get(apex.net.inbox.get)
router.route(routes.outbox).get(apex.net.outbox.get).post(apex.net.outbox.post)

// replace apex's target actor validator with our create on demand method
router.get(routes.actor, apex.net.actor.get)
router.get(routes.followers, apex.net.followers.get)
router.get(routes.following, apex.net.following.get)
router.get(routes.liked, apex.net.liked.get)
router.get(routes.object, apex.net.object.get)
router.get(routes.activity, apex.net.activityStream.get)
router.get(routes.shares, apex.net.shares.get)
router.get(routes.likes, apex.net.likes.get)
router.get('/nodeinfo/:version', apex.net.nodeInfo.get)

/// Guppe web setup
// html/static routes
// router.use(
//   history({
//     index: '/web/index.html',
//     rewrites: [
//       // do not redirect webfinger et c.
//       {
//         from: /^\/\.well-known\//,
//         to: (context) => context.request.originalUrl,
//       },
//     ],
//   }),
// )
// router.use('/f', express.static('public/files'))
// router.use('/web', express.static('web/dist'))
// web json routes
// router.get('/groups', (req, res, next) => {
//   apex.store.db
//     .collection('streams')
//     .aggregate([
//       { $sort: { _id: -1 } }, // start from most recent
//       { $limit: 10000 }, // don't traverse the entire history
//       { $match: { type: 'Announce' } },
//       { $group: { _id: '$actor', postCount: { $sum: 1 } } },
//       {
//         $lookup: {
//           from: 'objects',
//           localField: '_id',
//           foreignField: 'id',
//           as: 'actor',
//         },
//       },
//       // merge joined actor up
//       {
//         $replaceRoot: {
//           newRoot: {
//             $mergeObjects: [{ $arrayElemAt: ['$actor', 0] }, '$$ROOT'],
//           },
//         },
//       },
//       { $project: { _id: 0, _meta: 0, actor: 0 } },
//     ])
//     .sort({ postCount: -1 })
//     .limit(Number.parseInt(req.query.n) || 50)
//     .toArray()
//     .then((groups) =>
//       apex.toJSONLD({
//         id: `https://${DOMAIN}/groups`,
//         type: 'OrderedCollection',
//         totalItems: groups.length,
//         orderedItems: groups,
//       }),
//     )
//     // .then(groups => { console.log(JSON.stringify(groups)); return groups })
//     .then((groups) => res.json(groups))
//     .catch((err) => {
//       console.log(err.message)
//       return res.status(500).send()
//     })
// })
// router.get('/stats', async (req, res, next) => {
//   try {
//     const queueSize = await apex.store.db
//       .collection('deliveryQueue')
//       .countDocuments({ attempt: 0 })
//     const uptime = process.uptime()
//     res.json({ queueSize, uptime })
//   } catch (err) {
//     next(err)
//   }
// })

router.use(function (err, req, res, next) {
  console.error(err.message, req.body, err.stack)
  if (!res.headersSent) {
    res.status(500).send('An error occurred while processing the request')
  }
})

export async function init() {
  await client.connect()
  console.log('connected to MongoDB')

  apex.store.db = client.db(DB_NAME)
  await apex.store.setup()
  await apex.store.db.collection('servers').createIndex(
    {
      hostname: 1,
    },
    {
      name: 'servers-primary',
      unique: true,
    },
  )
  apex.systemUser = await apex.store.getObject(
    apex.utils.usernameToIRI('system_service'),
    true,
  )
  if (!apex.systemUser) {
    const systemUser = await createActor(
      'system_service',
      `${DOMAIN} system service`,
      `${DOMAIN} system service`,
      'Service',
    )
    apex.systemUser = systemUser
  }

  await createActor('repco')
}

// Initialize the AP server
// Needs to pass in the express server app to catch the apex events
export function initializeActivitypubExpress(app, prefix = '/ap') {
  app.on('apex-inbox', async ({ actor, activity, recipient, object }) => {
    switch (activity.type.toLowerCase()) {
      // automatically reshare incoming posts
      case 'create': {
        const to = [recipient.followers[0], apex.consts.publicAddress]
        const share = await apex.buildActivity('Announce', recipient.id, to, {
          object: activity.object[0].id,
          // make sure sender can see it even if they don't follow yet
          cc: actor.id,
        })
        apex.addToOutbox(recipient, share)
        break
      }
      // automatically accept follow requests
      case 'follow': {
        const accept = await apex.buildActivity(
          'Accept',
          recipient.id,
          actor.id,
          {
            object: activity.id,
          },
        )
        const { postTask: publishUpdatedFollowers } = await apex.acceptFollow(
          recipient,
          activity,
        )
        await apex.addToOutbox(recipient, accept)
        return publishUpdatedFollowers()
      }
    }
  })

  app.get('/.well-known/nodeinfo', apex.net.nodeInfoLocation.get)
  app.get(
    '/.well-known/webfinger',
    apex.net.wellKnown.parseWebfinger,
    apex.net.validators.targetActor,
    apex.net.wellKnown.respondWebfinger,
  )
  app.use(prefix, router)

  app.get('/ap-debug', async (req, res) => {
    await createRepoActor('test')
    await followActor('test', "http://localhost:9000/video-channels/test2")
    res.send("ok")
  })

  init(app).catch((err) =>
    console.error('failed to initialize ActivityPub server', err),
  )
}

// Create new groups on demand whenever someone tries to access one
async function createActor(actorName, displayName, summary, type) {
  const actorIRI = apex.utils.usernameToIRI(actorName)
  if (!(await apex.store.getObject(actorIRI)) && actorName.length <= 255) {
    console.log(`Creating actor: ${actorName}`)
    const actorObj = await apex.createActor(
      actorName,
      displayName,
      summary,
      icon,
      type,
    )
    if (USE_ATTACHMENTS) {
      actorObj.attachment = ATTACHEMENTS
    }
    await apex.store.saveObject(actorObj)
    return actorObj
  }
}

export async function createRepoActor(actorName, displayName) {
  const summary = `I'm a community media indexer Let me follow you to be indexed.`
  await createActor(actorName, displayName, summary, 'Person')
}

export async function followActor(localActorName, remoteActor) {
  const localActorIRI = apex.utils.usernameToIRI(localActorName)
  const localActor = apex.store.getObject(localActorIRI)
  const activity = apex.buildActivity('Follow', remoteActor, localActor.id, {
    object: localActor.id,
  })
  await apex.store.saveActivity(activity)
}
