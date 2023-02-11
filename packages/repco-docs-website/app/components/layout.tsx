import { NavLink, useLocation, useParams } from '@remix-run/react'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { Entry, EntryNode, intoFolders } from '~/lib/util'
import { SearchForm } from './search'

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
        <div className="flex-space" />
        <SearchForm />
      </div>
      <div className="layout-main">
        <Nav index={props.index} />
        <main>{props.children}</main>
      </div>
    </div>
  )
}

function Nav(props: NavProps) {
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(false)
  const toggleNav = () => setIsVisible((isVisible) => !isVisible)
  useEffect(() => setIsVisible(false), [location])
  const { index } = props
  const folders = useMemo(() => intoFolders(index), [index])
  const root = folders.ROOT
  if (!root) return null
  const cls = ['layout-nav']
  if (isVisible) cls.push('is-active')
  return (
    <nav role="navigation" aria-label="Menu" className={cls.join(' ')}>
      <button
        className="layout-nav--toggle"
        aria-label="Toggle menu"
        aria-expanded={isVisible}
        aria-controls="layout-nav--menu"
        onClick={toggleNav}
      >
        {isVisible ? 'Hide menu' : 'Show menu'}
      </button>
      <ul id="layout-nav--menu">
        {root.children.map((entry) => (
          <li key={entry.path}>
            <NavEntry entry={entry} />
          </li>
        ))}
      </ul>
    </nav>
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
  const id = 'layout-folder--' + btoa(entry.path).slice(0, -2)
  return (
    <div className="layout-folder">
      <h2 id={id}>{entry.data.title || entry.name}</h2>
      <ul aria-labelledby={id}>
        {entry.children.map((page) => (
          <li key={page.path}>
            <PageLink key={page.path} entry={page} />
          </li>
        ))}
      </ul>
    </div>
  )
}
