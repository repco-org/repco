import { fetch } from 'undici'
import { RssDataSource } from './src/datasources/rss.js'

main().catch(console.error)

async function main() {
  // const url = 'https://feeds.podlovers.org/mp3'
  const url = 'https://www.freie-radios.net/portal/podcast.php?rss&start=0&anzahl=2'
  const ds = new RssDataSource({
    endpoint: url,
  })

  const timeoutNext = 10
  const timeoutPoll = 1000 * 60
  // let cursor = null
  let cursor = JSON.stringify({
    newest: {
      lastCompletionDate: new Date('2022-09-27T17:19:02.000Z'),
      // lastCompletionDate: new Date(0),
    },
  })
  console.log('initCursor', cursor)

  const next = async (cursor: string | null) => {
    const batch = await ds.fetchUpdates(cursor)
    // console.log(
    //   'entities',
    //   batch.entities
    //     .filter((x) => x.type === 'ContentItem')
    //     .map(
    //       (e) =>
    //         `${e.content.uid} ${
    //           e.type === 'ContentItem' ? e.content.pubDate : ''
    //         }`,
    //     ),
    // )
    console.log('nextCursor', batch.cursor)
    return batch.cursor
  }

  const stop = false
  while (!stop) {
    cursor = await next(cursor)
    const info = JSON.parse(cursor)
    let nextTimeout = timeoutNext
    if (info.newest.isFinished) {
      nextTimeout = timeoutPoll
      console.log('fetched all - wait till next poll ....')
    }
    await new Promise((resolve) => setTimeout(resolve, nextTimeout))
  }
}
