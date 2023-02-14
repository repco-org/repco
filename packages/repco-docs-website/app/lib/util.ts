export type Doc = {
  data: Record<string, any>
  content: string
}

export interface Entry {
  type: 'page' | 'folder'
  path: string
  parent: string
  name: string
  data: any
}

export interface EntryNode extends Entry {
  parent: string
  children: EntryNode[]
}

export type FolderMap = Record<string, EntryNode>

export function intoFolders(list: Entry[]): FolderMap {
  const rootid = 'ROOT'
  const root: EntryNode = {
    type: 'folder',
    path: '',
    parent: '',
    name: '',
    data: {},
    children: [],
  }
  const folders: FolderMap = {}
  folders[rootid] = root

  for (const entry of list) {
    const node: EntryNode = { ...entry, children: [] }
    if (entry.type === 'folder') {
      folders[entry.path] = node
    }
    let parent = node.parent || rootid
    if (parent === '.') parent = rootid
    if (!folders[parent]) throw new Error('Missing parent: ' + parent)
    folders[parent].children.push(node)
  }
  for (const folder of Object.values(folders)) {
    // sort by weight, then by title, then by filename
    folder.children.sort((a, b) => {
      const [wa, wb] = [a.data.weight || 0, b.data.weight || 0]
      const [ta, tb] = [a.data.title || a.name, b.data.title || b.name]
      if (wa === wb) return ta > tb ? -1 : 1
      return wa - wb
    })
  }
  // console.log({ folders, list })
  return folders
}
