import { EntityForm, EntityBatch } from "../entity.js";

interface ExtractCursorFn<T> {
  (input: T): string
}

interface MapFn<T> {
  (input: T): EntityForm[];
}

export type FetchOpts = ResponseInit & {
  params?: Record<string, any>
}

export function extractCursorAndMap<T>(
  input: T[], 
  map: MapFn<T>,
  extractCursor: ExtractCursorFn<T>,
): EntityBatch | null {
  if (!input.length) return null
  const nextCursor = extractCursor(input.at(input.length - 1)!)
  const entities = []
  for (const item of input) {
    entities.push(...map(item))
  }
  return { cursor: nextCursor, entities }
}
