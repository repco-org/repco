import stylesUrl from '~/styles/index.css'
import { LinksFunction } from '@remix-run/node'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: stylesUrl }]
}

export default function Index() {
  return (
    <div className="center">
      <table className="table">
        <th>
          <h2>Browse this Node</h2>
        </th>
        <tr
          onClick={() => {
            window.open(`/item`)
          }}
        >
          <td>ContentItems</td>
        </tr>
        <tr
          onClick={() => {
            window.open(`/search`)
          }}
        >
          <td>Search by UID</td>
        </tr>
        <tr>
          <td>
            <s>Playlists</s>
          </td>
        </tr>
        <tr>
          <td className="login">sign in</td>
        </tr>
      </table>
    </div>
  )
}
