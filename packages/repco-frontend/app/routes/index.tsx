import { json, LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { gql } from 'graphql-request'
import { client } from '~/lib/graphql-client'

const getAllContentItems = gql`
  {
    allContentItems {
      uid
    }
  }
`
export const loader: LoaderFunction = async () => {
  const items = await client.request(getAllContentItems)
  return json(items)
}

export default function Index() {
  let data = useLoaderData()

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
