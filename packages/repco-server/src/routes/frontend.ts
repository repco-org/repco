// This mounts the Remix frontend into the server.
// It does this with await import() to make it optional if not needed.
// It also works around an incompatiblity by the insertGlobals()
// function from @remix-run/express which adds the streams from
// web-streams-polyfill, which are incompatible with those from
// node:stream/web as used in undici.

import express from 'express'
import p from 'path'
import { createRequire } from 'module'
import { log } from 'repco-common'

const handlers: Record<string, express.Handler> = {}

const notFoundHandler: express.Handler = (_req, res) => {
  res.status(404)
  res.end('Not found')
}

export function enableFrontend() {
  mountRemixFrontend().catch((err) =>
    log.warn('Frontend is not available: ' + err),
  )
}

async function mountRemixFrontend() {
  try {
    const frontendPath = frontendBasePath()
    const { createRequestHandler } = await import(
      '@remix-run/express/dist/server.js'
    )
    // @ts-ignore
    const { default: build } = await import('repco-frontend/build/index.js')
    await installGlobals()

    handlers.build = express.static(p.join(frontendPath, 'public/build'), {
      immutable: true,
      maxAge: '1y',
    })
    handlers.static = express.static(p.join(frontendPath, 'public'), {
      maxAge: '1h',
    })
    handlers.main = createRequestHandler({ build })
  } catch (err) {
    log.warn('Frontend is not available: ' + err)
  }
}

export const router = express.Router()

router.use('/build', (...args) =>
  handlers.build ? handlers.build(...args) : notFoundHandler(...args),
)
router.use((...args) =>
  handlers.static ? handlers.static(...args) : notFoundHandler(...args),
)
router.all('*', (...args) => {
  handlers.main ? handlers.main(...args) : notFoundHandler(...args)
})

function frontendBasePath() {
  const require = createRequire(import.meta.url)
  return p.dirname(require.resolve('repco-frontend/package.json'))
}

export async function installGlobals() {
  const { fetch, FormData, Headers, Request, Response } = await import(
    '@remix-run/web-fetch'
  )
  const { Blob, File } = await import('@remix-run/web-file')
  const { ReadableStream, WritableStream } = await import('stream/web')
  globalThis.Blob = Blob
  globalThis.File = File
  // @ts-ignore
  globalThis.Headers = Headers
  // @ts-ignore
  globalThis.Request = Request
  // @ts-ignore
  globalThis.Response = Response
  // @ts-ignore
  globalThis.fetch = fetch
  // @ts-ignore
  globalThis.FormData = FormData
  // @ts-ignore
  globalThis.ReadableStream = ReadableStream
  // @ts-ignore
  globalThis.WritableStream = WritableStream
}
