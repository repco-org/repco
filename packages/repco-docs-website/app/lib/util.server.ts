import fs from 'fs/promises'
import parseFrontmatter from 'gray-matter'
import chokidar from 'chokidar'
import p from 'path'
import type { Doc, Entry } from '~/lib/util.js'

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
    .on('change,add', async (event, path) => {
      console.log('trigger reload: ', p.relative(BASE, path))
      try {
        if (path.endsWith('.md')) await loadFile(path, { reload: true })
        await loadTree()
      } catch (err) { }
    })
}

export async function loadSlug(slug: string) {
  const path = p.normalize(p.join(BASE, slug + '.md'))
  return loadFile(path)
}

export type LoadOpts = { reload?: boolean }
export async function loadFile(
  path: string,
  opts: LoadOpts = {},
): Promise<Doc> {
  if (!path.startsWith(BASE)) throw new Error('Invalid path')
  if (!path.endsWith('.md')) throw new Error('Invalid file')
  if (opts.reload || !cache.docs[path]) {
    const text = await fs.readFile(path, { encoding: 'utf8' })
    cache.docs[path] = parseFrontmatter(text)
  }
  return cache.docs[path]
}

export async function loadTree(): Promise<Entry[]> {
  if (cache.index) return cache.index
  cache.index = []
  for await (const page of index(BASE)) {
    cache.index.push(page)
  }
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
        const { data } = await loadFile(path)
        const basename = p.basename(name, '.md')
        yield {
          type: 'page',
          name: basename,
          parent,
          path: p.join(parent, basename),
          data,
        }
      } catch (_err) { }
    } else if (type === 'folder') {
      let data = {}
      try {
        const res = await loadFile(p.join(path, 'index.md'))
        data = res.data
      } catch (_err) { }
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
