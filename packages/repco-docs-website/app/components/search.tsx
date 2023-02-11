import { Link, useSearchParams } from '@remix-run/react'

export function SearchResults({ results }: { results?: Record<string, any> }) {
  if (!results) return <em>No results</em>
  // {Object.entries(results).map(([id, doc]) => (
  //   <div key={id}>
  //     <h2>{doc.title || id}</h2>
  //     <pre>{JSON.stringify(doc)}</pre>
  //   </div>
  // ))}
  return (
    <div className='search-results'>
      {results.hits.map((result: any) => (
        <div key={result.id}>
          <h2><Link to={'/' + result.path}>{result.title || result.id}</Link></h2>
          {result._formatted.content && (
            <p className='search-results--content' dangerouslySetInnerHTML={{ __html: result._formatted.content }} />
          )}
          {/* <pre>{JSON.stringify(Object.fromEntries(Object.entries(result).filter(([k, _v]) => k !== 'content')), null, 2)}</pre> */}
        </div>
      ))}
    </div>
  )

}

export function SearchForm() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')
  return (
    <form method="get" action='/search' className='search-form'>
      <input type="text" name="q" defaultValue={query || undefined} placeholder="type to search..." />
      <button type="submit">Search</button>
    </form>
  )
}
