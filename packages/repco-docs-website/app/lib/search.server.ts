import { MeiliSearch } from 'meilisearch'
import { Doc } from './util'
import { remark } from 'remark'
import strip from 'strip-markdown'

async function stripMarkdown(md: string) {
  return String(await remark().use(strip).process(md))
}

export const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.MEILISEARCH_API_KEY,
})

export const documentIndex = client.index('docs')

export async function indexDocs(docs: Record<string, Doc>) {
  try {
    const rows = await Promise.all(Object.entries(docs).map(async ([id, doc]) => ({
      id: id.replace(/[^a-zA-z0-9\-_]/g, ''),
      ...doc.data,
      content: await stripMarkdown(doc.content),
      path: id,
    })))
    return await documentIndex.addDocuments(rows)
  } catch (err) {
    console.error('failed to index docs', err)
  }
}

export async function searchDocs(query: string) {
  const res = await documentIndex.search(query, {
    attributesToCrop: ['content'],
    attributesToHighlight: ['content'],
    cropMarker: '...',
  })
  return res
}
