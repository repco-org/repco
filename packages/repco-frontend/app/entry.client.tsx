// entry.client.tsx
import React, { useState } from 'react'
import { CacheProvider } from '@emotion/react'
import { RemixBrowser } from '@remix-run/react'
import { hydrate } from 'react-dom'
import createEmotionCache from './createEmotionCache'
import { ClientStyleContext } from './context'

interface ClientCacheProviderProps {
  children: React.ReactNode
}

function ClientCacheProvider({ children }: ClientCacheProviderProps) {
  const [cache, setCache] = useState(createEmotionCache())

  function reset() {
    setCache(createEmotionCache())
  }

  return (
    <ClientStyleContext.Provider value={{ reset }}>
      <CacheProvider value={cache}>{children}</CacheProvider>
    </ClientStyleContext.Provider>
  )
}

hydrate(
  <ClientCacheProvider>
    <RemixBrowser />
  </ClientCacheProvider>,
  document,
)
