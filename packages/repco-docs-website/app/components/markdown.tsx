import ReactMarkdown from 'react-markdown'
import { ReactMarkdownOptions } from 'react-markdown/lib/react-markdown'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import remarkMermaid from 'remark-mermaid-plugin'

type Props = ReactMarkdownOptions

export function Markdown(props: Props) {
  const { remarkPlugins = [], rehypePlugins = [] } = props
  const nextProps: Props = {
    ...props,
    remarkPlugins: [...remarkPlugins, remarkGfm, remarkMermaid],
    rehypePlugins: [...rehypePlugins, rehypeRaw, rehypeStringify],
  }
  return <ReactMarkdown {...nextProps} />
}
