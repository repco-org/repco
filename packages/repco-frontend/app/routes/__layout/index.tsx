import { useLoaderData } from '@remix-run/react'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { LoaderFunction } from 'react-router'
import { ContentItemCard } from '~/components/ui/primitives/Card'
import { DashboardQuery } from '~/graphql/queries/dashboard'
import { RepoStatsQuery } from '~/graphql/queries/repoStats'
import {
  LoadDashboardDataQuery,
  LoadRepoStatsQuery,
  LoadRepoStatsQueryVariables,
} from '~/graphql/types'
import { graphqlQuery } from '~/lib/graphql.server'

ChartJS.register(ArcElement, Tooltip, Legend)

export const backgroundColor = [
  '#FF6633',
  '#FFB399',
  '#FF33FF',
  '#FFFF99',
  '#00B3E6',
  '#E6B333',
  '#3366E6',
  '#999966',
  '#99FF99',
  '#B34D4D',
  '#80B300',
  '#809900',
  '#E6B3B3',
  '#6680B3',
  '#66991A',
  '#FF99E6',
  '#CCFF1A',
  '#FF1A66',
  '#E6331A',
  '#33FFCC',
  '#66994D',
  '#B366CC',
  '#4D8000',
  '#B33300',
  '#CC80CC',
  '#66664D',
  '#991AFF',
  '#E666FF',
  '#4DB3FF',
  '#1AB399',
  '#E666B3',
  '#33991A',
  '#CC9999',
  '#B3B31A',
  '#00E680',
  '#4D8066',
  '#809980',
  '#E6FF80',
  '#1AFF33',
  '#999933',
  '#FF3380',
  '#CCCC00',
  '#66E64D',
  '#4D80CC',
  '#9900B3',
  '#E64D66',
  '#4DB380',
  '#FF4D4D',
  '#99E6E6',
  '#6666FF',
]

export const loader: LoaderFunction = async ({ request }) => {
  const { data } = await graphqlQuery<LoadDashboardDataQuery>(
    DashboardQuery,
    undefined,
  )
  const repoStats = data?.repos?.nodes.length
    ? await Promise.all(
        data.repos.nodes.map(async (item) => {
          return await graphqlQuery<
            LoadRepoStatsQuery,
            LoadRepoStatsQueryVariables
          >(RepoStatsQuery, {
            repoDid: item.did,
          })
        }),
      )
    : []

  const publicationServicesChartData = {
    labels: data?.publicationServices?.nodes.map((item) => {
      return item.name
    }),
    datasets: [
      {
        data: data?.publicationServices?.nodes.map((item) => {
          return item.contentItems.totalCount
        }),
        backgroundColor,
      },
    ],
  }

  const repoChartData = {
    labels: repoStats?.map((item) => item.data?.repos?.nodes[0].name),
    datasets: [
      {
        data: repoStats?.map((item) => item.data?.contentItems?.totalCount),
        backgroundColor,
      },
    ],
  }

  return {
    data,
    repoChartData,
    publicationServicesChartData,
    totalContentItems: data?.contentItems?.totalCount,
    totalPublicationServices: data?.publicationServices?.totalCount,
  }
}

export default function Index() {
  const {
    data,
    publicationServicesChartData,
    repoChartData,
    totalContentItems,
    totalPublicationServices,
  } = useLoaderData<typeof loader>()

  return (
    <div>
      <div className="bg-hero h-52 p-4 text-white text-xl flex items-center justify-center">
        <div className="w-1/2">
          {totalContentItems} ContentItems from
          {totalPublicationServices} different publication services have been
          indexed so far
        </div>
      </div>

      <div className="flex space-x-2 my-2">
        <div className="w-1/3 flex flex-col items-center p-2 bg-slate-300 align-middle">
          <h3>PublicationServices</h3>
          <Doughnut data={publicationServicesChartData} />
        </div>
        <div className="w-1/3 flex flex-col items-center p-2 bg-slate-300 align-middle">
          <h3>Repositorys</h3>
          <Doughnut data={repoChartData} />
        </div>
        <div className="w-1/3 flex flex-col p-4 text-sm bg-slate-300 align-middle">
          <h3>PublicationServices ({data?.publicationServices.totalCount})</h3>
          <ul className="p-2">
            {data?.publicationServices.nodes.map(
              (publicationService: { name: string }, i: number) => (
                <li key={i}>{publicationService.name}</li>
              ),
            )}
          </ul>
        </div>
      </div>

      <div>
        <h3>Repositorys ({data?.repos.totalCount})</h3>
        <div className="flex flex-col space-y-2 ">
          {data?.repos.nodes.map(
            (repo: { name: string; did: string }, i: number) => (
              <ContentItemCard>
                <div className="flex items-baseline space-x-4">
                  {' '}
                  <h3 className="text-brand-primary text-lg" key={i}>
                    {repo.name}
                  </h3>
                  <span className="text-xs italic">{repo.did}</span>
                </div>
              </ContentItemCard>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
