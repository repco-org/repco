import sanitize from 'sanitize-html'
import { useMemo } from 'react'
import type { IOptions } from 'sanitize-html'

export type SanitzedHTMLProps = IOptions & { html: string }

export function SanitizedHTML(props: SanitzedHTMLProps) {
  const sanitized = useMemo(() => {
    return sanitize(props.html, props)
  }, [props])
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}
