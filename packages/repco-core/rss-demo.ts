import { RssDataSource } from './src/datasources/rss.js'

main().catch(console.error)

async function main() {
  const url =
    'https://www.freie-radios.net/portal/podcast.php?rss&start=0&anzahl=2'
  const ds = new RssDataSource({
    endpoint: url,
  })

  const timeout = 1000
  // let cursor = null
  let cursor = JSON.stringify({
    newest: {
      newestDate: new Date('2022-08-31T15:19:02.000Z'),
    },
  })
  console.log('initCursor', cursor)

  const next = async (cursor: string | null) => {
    const batch = await ds.fetchUpdates(cursor)
    console.log(
      'entities',
      batch.entities
        .filter((x) => x.type === 'ContentItem')
        .map(
          (e) =>
            `${e.content.uid} ${
              e.type === 'ContentItem' ? e.content.pubDate : ''
            }`,
        ),
    )
    console.log('nextCursor', batch.cursor)
    return batch.cursor
  }

  const stop = false
  while (!stop) {
    cursor = await next(cursor)
    const info = JSON.parse(cursor)
    let nextTimeout = timeout
    if (info.newest.isFinished) {
      nextTimeout = timeout * 10
      console.log('fetched all - wait till next poll ....')
    }
    await new Promise((resolve) => setTimeout(resolve, nextTimeout))
  }
}
