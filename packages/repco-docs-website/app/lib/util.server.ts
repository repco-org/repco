import chokidar from 'chokidar'
import fs from 'fs/promises'
import parseFrontmatter from 'gray-matter'
import p from 'path'
import type { Doc, Entry } from '~/lib/util.js'
import { indexDocs } from './search.server'

// const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const PATH_TO_DOCS = '../../../docs'
const BASE = p.normalize(p.join(__dirname, PATH_TO_DOCS))
const WATCH_MODE = process.env.NODE_ENV === 'development'

type Cache = { docs: Record<string, Doc>; index?: Entry[] }
const cache: Cache = { docs: {} }

if (WATCH_MODE) {
  chokidar
    .watch(BASE + '/**/*.md', {
      ignoreInitial: true,
      awaitWriteFinish: true,
    })
    .on('change,add', async (_event, path) => {
      console.log('trigger reload: ', p.relative(BASE, path))
      try {
        if (path.endsWith('.md'))
          await loadPage(path, { reload: true, absolutePath: true })
        await loadTree()
      } catch (err) {}
    })
}

export type LoadOpts = { reload?: boolean; absolutePath?: boolean }

export async function loadPage(
  path: string,
  opts: LoadOpts = {},
): Promise<Doc> {
  if (!opts.absolutePath) path = p.join(BASE, path + '.md')
  path = p.normalize(path)
  if (!path.startsWith(BASE)) throw new Error('Invalid path')
  if (!path.endsWith('.md')) throw new Error('Invalid file')
  const id = path.substring(BASE.length + 1, path.length - 3)
  if (opts.reload || !cache.docs[id]) {
    const text = await fs.readFile(path, { encoding: 'utf8' })
    cache.docs[id] = parseFrontmatter(text)
  }
  return cache.docs[id]
}

export async function loadTree(): Promise<Entry[]> {
  if (cache.index) return cache.index
  cache.index = []
  for await (const page of index(BASE)) {
    cache.index.push(page)
  }
  indexDocs(cache.docs)
  return cache.index
}

async function* index(dir: string): AsyncIterable<Entry> {
  for await (const { type, name, path } of walk(dir)) {
    const npath = p.normalize(path)
    if (!npath.startsWith(dir)) continue
    const rpath = p.relative(dir, npath)
    const parent = p.dirname(rpath)
    if (type === 'file') {
      // skip index files
      if (name === 'index.md') continue
      try {
        const { data } = await loadPage(path, { absolutePath: true })
        const basename = p.basename(name, '.md')
        yield {
          type: 'page',
          name: basename,
          parent,
          path: p.join(parent, basename),
          data,
        }
      } catch (_err) {}
    } else if (type === 'folder') {
      let data
      try {
        const res = await loadPage(p.join(path, 'index.md'), {
          absolutePath: true,
        })
        data = res.data
      } catch (_err) {
        data = {}
      }

      yield {
        path: rpath,
        type: 'folder',
        name,
        parent,
        data,
      }
    }
  }
}

async function* walk(dir: string): AsyncIterable<{
  name: string
  path: string
  type: 'file' | 'folder'
}> {
  for await (const d of await fs.opendir(dir)) {
    const name = d.name
    const path = p.join(dir, d.name)
    if (d.isDirectory()) {
      yield { path, name, type: 'folder' }
      yield* walk(path)
    } else if (d.isFile()) {
      yield { path, name, type: 'file' }
    }
  }
}
