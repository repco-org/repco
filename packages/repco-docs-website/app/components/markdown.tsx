import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkMermaid from 'remark-mermaid-plugin'
import type { ReactMarkdownOptions } from 'react-markdown/lib/react-markdown'

type Props = ReactMarkdownOptions

export function Markdown(props: Props) {
  const { remarkPlugins = [], rehypePlugins = [] } = props
  const nextProps: Props = {
    ...props,
    remarkPlugins: [...remarkPlugins, remarkGfm, remarkMermaid],
    rehypePlugins: [...rehypePlugins, rehypeRaw, rehypeStringify],
  }
  return (
    <div className="markdown">
      <ReactMarkdown {...nextProps} />
    </div>
  )
}
