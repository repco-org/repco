import ClosableJumbotron from '~/components/jumbotron/jumbotron'
import { NavLink, useLoaderData } from '@remix-run/react'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import type { LoaderFunction } from 'react-router'
import { ContentItemCard } from '~/components/primitives/card'
import { DashboardQuery } from '~/graphql/queries/dashboard'
import { PublicationServicesQuery } from '~/graphql/queries/publicationServices'
import { RepoStatsQuery } from '~/graphql/queries/repo-stats'
import type {
  LoadDashboardDataQuery,
  LoadPublicationServicesQuery,
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

// export const loader: LoaderFunction = async ({ request }) => {
//   const { data } = await graphqlQuery<LoadDashboardDataQuery>(
//     DashboardQuery,
//     undefined,
//   )
//   const repoStats = data?.repos?.nodes.length
//     ? await Promise.all(
//         data.repos.nodes.map(async (item) => {
//           return await graphqlQuery<
//             LoadRepoStatsQuery,
//             LoadRepoStatsQueryVariables
//           >(RepoStatsQuery, {
//             repoDid: item.did,
//           })
//         }),
//       )
//     : []

//   const publicationServicesChartData = {
//     labels: data?.publicationServices?.nodes.map((item) => {
//       return item.name
//     }),
//     datasets: [
//       {
//         data: data?.publicationServices?.nodes.map((item) => {
//           return item.contentItems.totalCount
//         }),
//         backgroundColor,
//       },
//     ],
//   }

//   const repoChartData = {
//     labels: repoStats?.map((item) => item.data?.repos?.nodes[0].name),
//     datasets: [
//       {
//         data: repoStats?.map((item) => item.data?.contentItems?.totalCount),
//         backgroundColor,
//       },
//     ],
//   }

//   return {
//     data,
//     repoChartData,
//     publicationServicesChartData,
//     totalContentItems: data?.contentItems?.totalCount,
//     totalPublicationServices: data?.publicationServices?.totalCount,
//   }
// }

export const loader: LoaderFunction = async ({ request }) => {
  const { data } = await graphqlQuery<LoadDashboardDataQuery>(
    DashboardQuery,
    undefined,
  )

  let publicationServicesChartData = {}
  if (data?.publicationServices?.totalCount === undefined) {
    publicationServicesChartData = { labels: [], datasets: [] }
  } else if (data.publicationServices.totalCount <= 10) {
    publicationServicesChartData = {
      labels: data.publicationServices.nodes.map((item) => item.name),
      datasets: [
        {
          data: data.publicationServices.nodes.map(
            (item) => item.contentItems.totalCount,
          ),
          backgroundColor,
        },
      ],
    }
  } else {
    const { data: pubServicesData } =
      await graphqlQuery<LoadPublicationServicesQuery>(
        PublicationServicesQuery,
        { totalCount: data.publicationServices.totalCount },
      )
    publicationServicesChartData = {
      labels: pubServicesData?.publicationServices?.nodes.map(
        (item) => item.name,
      ),
      datasets: [
        {
          data: pubServicesData?.publicationServices?.nodes.map(
            (item) => item.contentItems.totalCount,
          ),
          backgroundColor,
        },
      ],
    }
  }

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
    <div className="felx flex-col space-y-4">
      {/* <div className="bg-hero h-52 p-4 text-white text-xl flex items-center justify-center">
        <div className="w-1/2">
          {totalContentItems} ContentItems from {totalPublicationServices}{' '}
          different publication services have been indexed so far
        </div>
      </div> */}

      <div className="w-1/2 mx-auto">
        <ClosableJumbotron
          title="Welcome to RepCo"
          message={`${totalContentItems} ContentItems from ${totalPublicationServices} different publication services have been indexed so far`}
        />
      </div>
      <div className="flex space-x-2 my-2">
        <div className="w-1/3 flex flex-col items-center p-2 bg-slate-300 align-middle">
          <h3 className="text-xl">PublicationServices</h3>
          <Doughnut data={publicationServicesChartData} />
        </div>
        <div className="w-1/3 flex flex-col items-center p-2 bg-slate-300 align-middle">
          <h3 className="text-xl">Repositorys</h3>
          <Doughnut data={repoChartData} />
        </div>
        <div className="w-1/3 flex flex-col p-4 text-sm bg-slate-300 align-middle">
          <h3 className="text-xl">
            PublicationServices ({data?.publicationServices.totalCount})
          </h3>
          <ul className="p-2">
            {publicationServicesChartData.labels.map(
              (publicationService: string, i: number) => (
                <li key={i}>{publicationService}</li>
              ),
            )}
          </ul>
        </div>
        <div className="w-1/3 flex flex-col p-4 text-sm bg-slate-300 align-middle">
          <h3 className="text-xl">Stats</h3>
          <ul className="p-2">
            <li>
              <span>ContentItems:</span> {data?.contentItems.totalCount}
            </li>
            <li>Files: {data?.files.totalCount}</li>
            <li>mediaAssets: {data?.mediaAssets.totalCount}</li>
            <li>Commits: {data?.commits.totalCount}</li>
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
