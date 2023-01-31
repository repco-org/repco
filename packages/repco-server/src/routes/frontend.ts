import remix from '@remix-run/express'
import express from 'express'
import p from 'path'
// @ts-ignore
import build from 'repco-frontend/build/index.js'
import { createRequire } from 'module'

const FRONTEND_BASE_PATH = frontendBasePath()

const router = express.Router()

router.use(
  '/build',
  express.static(frontendPath('public/build'), {
    immutable: true,
    maxAge: '1y',
  }),
)
router.use(express.static(frontendPath('public'), { maxAge: '1h' }))
router.all('*', remix.createRequestHandler({ build }))

export default router

function frontendPath(path: string) {
  return p.join(FRONTEND_BASE_PATH, path)
}
function frontendBasePath() {
  const require = createRequire(import.meta.url)
  return p.dirname(require.resolve('repco-frontend/package.json'))
}
