import DOMPurify from 'dompurify'
import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('repco-post-card-body')
export class RepcoPostCardBodyElement extends LitElement {
  static override styles = css`
    :host {
      flex-grow: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 6;
      -webkit-box-orient: vertical;
      max-height: 100%;
      margin-bottom: 0.5rem;
    }
  `

  @property()
  body = ''
  override render() {
    return html`${DOMPurify.sanitize(this.body)
      .trim()
      .replace(/<\/?p>/g, '')}`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'repco-post-card-body': RepcoPostCardBodyElement
  }
}
