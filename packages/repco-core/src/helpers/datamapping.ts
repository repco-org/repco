import { RequestInit } from 'undici'
import { EntityBatch, EntityForm } from '../entity.js'

interface ExtractCursorFn<T> {
  (input: T): string
}

interface MapFn<T> {
  (input: T): EntityForm[]
}

export type FetchOpts = RequestInit & {
  params?: Record<string, any>
}

export function extractCursorAndMap<T>(
  input: T[],
  map: MapFn<T>,
  extractCursor: ExtractCursorFn<T>,
): EntityBatch | null {
  const last = input[input.length - 1]
  if (last === undefined) return null
  const nextCursor = extractCursor(last)
  const entities = []
  for (const item of input) {
    entities.push(...map(item))
  }
  return { cursor: nextCursor, entities }
}
