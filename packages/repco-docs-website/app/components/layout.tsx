import { NavLink, useParams } from '@remix-run/react'
import { PropsWithChildren, useMemo } from 'react'
import { Entry, EntryNode, intoFolders } from '~/lib/util'

type NavProps = { index: Entry[] }
type LayoutProps = PropsWithChildren<NavProps>

export function Layout(props: LayoutProps) {
  const { '*': slug } = useParams()
  return (
    <div className="layout-wrapper">
      <div className="layout-header">
        <a href="/">
          <h1>REPCO</h1>
        </a>
        <div>Replication & Collector</div>
        <div className="layout-header--slug">{slug}</div>
      </div>
      <div className="layout-main">
        <Nav index={props.index} />
        <main>{props.children}</main>
      </div>
    </div>
  )
}

function Nav(props: NavProps) {
  const { index } = props
  const folders = useMemo(() => intoFolders(index), [index])
  const root = folders.ROOT
  if (!root) return null
  return (
    <div className="layout-nav">
      {root.children.map((entry) => (
        <NavEntry key={entry.path} entry={entry} />
      ))}
    </div>
  )
}

function NavEntry({ entry }: { entry: EntryNode }) {
  if (entry.type === 'folder') return <Folder entry={entry} />
  if (entry.type === 'page') return <PageLink entry={entry} />
  return null
}

function PageLink({ entry }: { entry: Entry }) {
  return (
    <NavLink key={entry.path} to={entry.path}>
      {entry.data.title || entry.name}
    </NavLink>
  )
}

function Folder({ entry }: { entry: EntryNode }) {
  return (
    <div className="layout-folder">
      <h2>{entry.data.title || entry.name}</h2>
      <ul>
        {entry.children.map((page) => (
          <PageLink key={page.path} entry={page} />
        ))}
      </ul>
    </div>
  )
}
