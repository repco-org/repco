import { Markdown } from '~/components/markdown'

export type PageProps = { content: string; data: any }

export function Page({ content, data }: PageProps) {
  let date
  if (data.date) date = new Date(data.date)
  return (
    <div>
      {date && <span className="date">Published: {date.toDateString()}</span>}
      <Markdown>{content}</Markdown>
    </div>
  )
}
