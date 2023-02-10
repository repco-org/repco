import express from 'express'
import p from 'path'
import { createRequire } from 'module'
import { createRequestHandler } from '@remix-run/express'

// @ts-ignore
import * as build from './build/index.js'

const frontendPath = frontendBasePath()

const app = express()

app.use('/build', 
      express.static(p.join(frontendPath, 'public/build'), {
      immutable: true,
      maxAge: '1y',
    })
)
app.use(
    express.static(p.join(frontendPath, 'public'), {
      maxAge: '1h',
    })
)
app.all('*', createRequestHandler({ build }, undefined, 'development'))
app.use((_req, res) => {
  res.status(404)
  res.end('Not found')
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`)
})

function frontendBasePath() {
  const require = createRequire(import.meta.url)
  return p.dirname(require.resolve('repco-frontend/package.json'))
}
