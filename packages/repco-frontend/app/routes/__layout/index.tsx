import ClosableJumbotron from '~/components/jumbotron/jumbotron'
import { NavLink, useLoaderData } from '@remix-run/react'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { endOfMonth, startOfMonth, subMonths } from 'date-fns'
import { Doughnut } from 'react-chartjs-2'
import type { LoaderFunction } from 'react-router'
import { ContentItemCard } from '~/components/primitives/card'
import { DashboardQuery } from '~/graphql/queries/dashboard'
import { RepoStatsQuery } from '~/graphql/queries/repo-stats'
import type {
  LoadDashboardDataQuery,
  LoadRepoStatsQuery,
  LoadRepoStatsQueryVariables,
} from '~/graphql/types'
import { graphqlQuery } from '~/lib/graphql.server'

ChartJS.register(ArcElement, Tooltip, Legend)

const backgroundColor = Array.from(
  { length: 50 },
  () =>
    `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(
      Math.random() * 256,
    )}, ${Math.floor(Math.random() * 256)}, 0.7)`,
)
function onlyResolved<T>(
  results: PromiseSettledResult<T>,
): results is PromiseFulfilledResult<T> {
  return results.status === 'fulfilled'
}
const now = new Date()
const start = startOfMonth(subMonths(now, 3))
const end = endOfMonth(now)

const dateRange = { start, end }

export const loader: LoaderFunction = async ({ request }) => {
  const { data } = await graphqlQuery<LoadDashboardDataQuery>(
    DashboardQuery,
    dateRange,
  )
  let publicationServicesNodes = data?.publicationServices?.nodes ?? []
  if (publicationServicesNodes.length > 1) {
    // Sort the publication services by the number of content items in descending order
    publicationServicesNodes = publicationServicesNodes.sort(
      (a, b) => b.contentItems?.totalCount - a.contentItems?.totalCount,
    )
    // Extract the top 5 publication services and combine the rest as "Others"
    const top10 = publicationServicesNodes.slice(0, 10)
    const othersCount = publicationServicesNodes
      .slice(5)
      .reduce((sum, node) => sum + (node.contentItems?.totalCount ?? 0), 0)
    publicationServicesNodes = [
      ...top10,
      {
        name: `..and more (${othersCount})`,
        contentItems: { totalCount: othersCount },
      },
    ]
  }

  const labels = publicationServicesNodes.map((item) => item.name)
  const dataPoints = publicationServicesNodes.map(
    (item) => item.contentItems?.totalCount,
  )

  const repoStats = data?.repos?.nodes?.length
    ? await Promise.allSettled(
        data.repos.nodes.map((item) =>
          graphqlQuery<LoadRepoStatsQuery, LoadRepoStatsQueryVariables>(
            RepoStatsQuery,
            { repoDid: item.did },
          ).catch((error) => {
            console.error(`Failed to load repo stats for ${item.did}: ${error}`)
            return Promise.resolve(null)
          }),
        ),
      )
    : []

  const resolved = repoStats.filter(onlyResolved)
  for (const value of resolved) {
    value.value
  }

  const repoChartData = {
    labels: resolved
      .map((result) => result.value?.data?.repos?.nodes?.[0]?.name)
      .filter((name) => !!name),
    datasets: [
      {
        data: resolved
          .map((result) => result.value?.data?.contentItems?.totalCount)
          .filter((count) => !!count),
        backgroundColor,
      },
    ],
  }

  const filteredRepoStats = repoStats.filter((result) => result !== null)

  return {
    data,
    repoChartData,
    publicationServicesChartData: {
      labels,
      datasets: [{ data: dataPoints, backgroundColor }],
    },
    totalContentItems: data?.contentItems?.totalCount,
    totalPublicationServices: data?.publicationServices?.totalCount,
    rejectedPromises: filteredRepoStats.filter(
      (result) => !onlyResolved(result),
    ),
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
  console.log(data?.latestConetentItems?.nodes)
  return (
    <div className="flex flex-col space-y-4">
      <div className="w-1/2 mx-auto">
        <ClosableJumbotron
          title="Welcome to REPCO"
          message={`${totalContentItems} ContentItems from ${totalPublicationServices} publication services have been indexed so far`}
        />
      </div>
      <div className="flex space-x-2 my-2">
        <div className="w-1/3 flex flex-col items-center p-2 bg-white shadow-lg rounded-lg hover:shadow-xl">
          <h3 className="text-xl text-center">
            Publication Services by ContentItems (last 3 Month)
          </h3>
          <Doughnut data={publicationServicesChartData} />
        </div>
        <div className="w-1/3 flex flex-col items-center p-2 bg-white shadow-lg rounded-lg hover:shadow-xl">
          <h3 className="text-xl text-center">Repositories</h3>
          <Doughnut data={repoChartData} />
        </div>
        <div className="w-1/3 flex flex-col p-4 text-sm bg-white shadow-lg rounded-lg hover:shadow-xl">
          <h3 className="text-xl text-center">latest ContentItems</h3>
          <ul className="p-2">
            {data?.latestConetentItems?.nodes.map(
              (node: any, index: number) => (
                <li key={index} title={node.title}>
                  <NavLink to={`/items/${node.uid}`}>
                    {node.title.length > 20
                      ? node.title.slice(0, 45) + '...'
                      : node.title}
                  </NavLink>
                </li>
              ),
            )}
          </ul>
        </div>
        <div className="w-1/3 flex flex-col p-4 text-sm bg-white shadow-lg rounded-lg hover:shadow-xl">
          <h3 className="text-xl">Stats</h3>
          <ul className="p-2">
            <li>
              <span>Content Items:</span> {data?.totalContentItems.totalCount}
            </li>
            <li>Files: {data?.files.totalCount}</li>
            <li>Media Assets: {data?.mediaAssets.totalCount}</li>
            <li>Commits: {data?.commits.totalCount}</li>
            <li>
              Publication Services: {data?.publicationServices.totalCount}
            </li>
            <li>Repositories: {data?.repos.totalCount}</li>
            <li>Concepts: {data?.concepts.totalCount}</li>
            <li>Content Groupings: {data?.contentGroupings.totalCount}</li>
            <li>Datasources: {data?.dataSources.totalCount}</li>
            <li>Source Records: {data?.sourceRecords.totalCount}</li>
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-2xl">Repositorys ({data?.repos.totalCount})</h3>
        <div className="flex flex-col p-1">
          {data?.repos.nodes.map(
            (repo: { name: string; did: string }, i: number) => (
              <NavLink to={`items?includes=&repoDid=${repo.did}`}>
                <ContentItemCard key={i}>
                  <div className="flex items-baseline space-x-4">
                    {' '}
                    <h3 className="text-brand-primary text-lg" key={i}>
                      {repo.name}
                    </h3>
                    <span className="text-xs italic">{repo.did}</span>
                  </div>
                </ContentItemCard>
              </NavLink>
            ),
          )}
        </div>
      </div>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between align-middle">
          <div className="flex flex-col w-2/3 space-y-2">
            <h4 className="text-xl">Repco is a project by:</h4>
            <div className="flex space-x-5 ">
              <a className="flex w-1/6" href="https://arso.xyz">
                <img
                  className="object-contain"
                  src={'https://github.com/arso-project.png'}
                />
              </a>

              <a href="https://cba.media" className="w-1/6 flex">
                <img
                  className=" object-contain"
                  src="https://cba.media/wp-content/themes/cba2020/images/cba_logo.svg"
                />
              </a>
            </div>
          </div>
          <div className="flex flex-col w-1/3 space-y-2">
            <h4 className="text-xl">And kindly supported by:</h4>

            <a className="flex w-1/2" href="https://culturalfoundation.eu">
              <img
                className=" object-contain"
                src="https://culturalfoundation.eu/wp-content/themes/ecf/img/logo.svg"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
