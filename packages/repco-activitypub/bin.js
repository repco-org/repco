import {
  initializeActivitypubExpress,
  router as activitypubRoutes,
} from 'repco-activitypub'
import express from 'express'

const app = express()
initializeActivitypubExpress(app).catch((err: any) =>
  console.error('failed to initialize ActivityPub server', err),
)
app.use('/ap', activitypubRoutes)
const port = process.env.PORT || 8765
app.listen(port, (err) => {
  if (err) console.error(err)
  else console.log('listening on http://localhost:' + port)
})
