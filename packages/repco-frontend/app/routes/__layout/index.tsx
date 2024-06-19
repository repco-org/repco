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
]
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
  let publicationServicesNodes = data?.publicationServices?.nodes || []
  if (publicationServicesNodes.length > 1) {
    // Sort the publication services by the number of content items in descending order
    publicationServicesNodes.sort(
      (a, b) => b.contentItems?.totalCount - a.contentItems?.totalCount,
    )
    // Extract the top 10 publication services and combine the rest as "... and more"
    const top10 = []
    const othersCount = publicationServicesNodes
      .slice(10)
      .reduce((sum, node) => sum + (node.contentItems?.totalCount || 0), 0)
    for (let i = 0; i < 10 && i < publicationServicesNodes.length; i++) {
      top10.push(publicationServicesNodes[i])
    }
    if (othersCount > 0) {
      top10.push({
        name: `..and more (${othersCount})`,
        contentItems: { totalCount: othersCount },
      })
    }
    publicationServicesNodes = top10
  }

  const labels = publicationServicesNodes.map((item) => item.name[Object.keys(item.name)[0]]['value'])
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
    totalContentItems: data?.totalContentItems?.totalCount,
    totalPublicationServices: data?.totalPublicationServices?.totalCount,
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
  return (
    <div className="flex flex-col space-y-4">
      <div className="mx-auto w-full" aria-label="Jumbotron">
        <ClosableJumbotron
          title="Welcome to REPCO"
          message={`${totalContentItems} ContentItems from ${totalPublicationServices} publication services have been indexed so far`}
          aria-live="assertive"
          aria-atomic="true"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col items-center p-2 bg-white shadow-lg rounded-lg hover:shadow-xl">
          <h3 className="text-xl text-center">
            Publication Services by ContentItems (last 3 Month)
          </h3>
          <Doughnut
            aria-label="Publication services by content items chart"
            data={publicationServicesChartData}
          />
        </div>
        <div className="flex flex-col items-center p-2 bg-white shadow-lg rounded-lg hover:shadow-xl">
          <h3 className="text-xl text-center">Repositories</h3>
          <Doughnut
            aria-label="Repositories viewed as chart"
            data={repoChartData}
          />
        </div>
        <div className="flex flex-col p-4 text-sm bg-white shadow-lg rounded-lg hover:shadow-xl">
          <h3 className="text-xl text-center">latest ContentItems</h3>
          <ul className="p-2">
            {data?.latestConetentItems?.nodes.map(
              (node: any, index: number) => (
                <li key={index}>
                  <NavLink to={`/items/${node.uid}`}>
                    {node.title[Object.keys(node?.title)[0]]['value'].length > 20
                      ? node.title[Object.keys(node?.title)[0]]['value'].slice(0, 45) + '...'
                      : node.title[Object.keys(node?.title)[0]]['value']}
                  </NavLink>
                </li>
              ),
            )}
          </ul>
        </div>
        <div className="flex flex-col p-4 text-sm bg-white shadow-lg rounded-lg hover:shadow-xl">
          <h3 className="text-xl">Stats</h3>
          <ul className="p-2">
            <li>
              <span>Content Items:</span> {data?.totalContentItems.totalCount}
            </li>
            <li>Files: {data?.files.totalCount}</li>
            <li>Media Assets: {data?.mediaAssets.totalCount}</li>
            <li>Commits: {data?.commits.totalCount}</li>
            <li>
              Publication Services: {data?.totalPublicationServices?.totalCount}
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
              <NavLink key={i} to={`items?includes=&repoDid=${repo.did}`}>
                <ContentItemCard
                  aria-label={`Repository ${repo.name} with DID ${repo.did}`}
                >
                  <div className="flex items-baseline space-x-4">
                    <h3 className="text-brand-primary text-lg" key={i}>
                      {repo.name}
                    </h3>
                    <span className="text-xs italic">({repoChartData.datasets[repoChartData.labels.indexOf(repo.name)]?.data}) {repo.did}</span>
                  </div>
                </ContentItemCard>
              </NavLink>
            ),
          )}
        </div>
      </div>

      <div>
        <h3 className="text-2xl">Datasources ({data?.dataSources.totalCount})</h3>
        <div className="flex flex-col p-1">
          {data?.dataSources.nodes.map(
            (ds: { config: any; }, i: number) => (
              <a key={i} href={ds.config.url} target={'_blank'}>
                <ContentItemCard
                  aria-label={`Datasource ${ds.config.name}`}
                >
                  <div className="flex items-baseline space-x-4">
                    <h3 className="text-brand-primary text-lg" key={i} style={{display: 'flex'}}>
                      <img src={ds.config.thumbnail} style={{display: 'block', margin: 'auto', paddingRight: '8px'}} />
                      {ds.config.name}
                    </h3>
                    <span className="text-xs italic">{ds.config.endpoint}</span>
                  </div>
                </ContentItemCard>
              </a>
            ),
          )}
        </div>
      </div>

      <div>
        <h3 className="text-2xl">Publication Services ({data?.publicationServices.totalCount})</h3>
        <div className="flex flex-col p-1">
          {data?.publicationServices.nodes.map(
            (ps: { name: any; contentItems: any }, i: number) => (
              <ContentItemCard
                aria-label={`Publicationservice ${ps.name[Object.keys(ps.name)[0]].value}`}
              >
                <div className="flex items-baseline space-x-4">
                  <h3 className="text-brand-primary text-lg" key={i} style={{display: 'flex'}}>
                    {ps.name[Object.keys(ps.name)[0]].value}
                  </h3>
                  <span className="text-xs italic">({ps.contentItems.totalCount})</span>
                </div>
              </ContentItemCard>
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
                  alt="arso-logo"
                />
              </a>
              <a href="https://cba.media" className="w-1/6 flex">
                <img
                  className=" object-contain"
                  src="https://cba.media/wp-content/themes/cba2020/images/cba_media_logo.svg"
                  alt="cba-logo"
                />
              </a>
            </div>
          </div>
          <div className="flex flex-col w-1/3 space-y-2" style={{marginBottom: '8px'}}>
            <h4 className="text-xl">And kindly supported by:</h4>
            <div className='flex'>
              <a className="flex w-1/3" href="https://culturalfoundation.eu">
                <img
                  className=" object-contain"
                  src="https://culturalfoundation.eu/wp-content/themes/ecf/img/logo.svg"
                  alt="ecf-logo"
                />
              </a>
              <a href="#" className="w-1/3 flex">
                <img
                  className=" object-contain"
                  src="https://cba.media/wp-content/uploads/6/3/0000660636/eu-logo.png"
                  alt="eu-logo"
                />
              </a>
              <a href="https://www.rtr.at" className="w-1/3 flex">
                <img
                  className=" object-contain"
                  src="https://cba.media/wp-content/uploads/5/3/0000660635/rtr-logo.jpg"
                  alt="rtr-logo"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
