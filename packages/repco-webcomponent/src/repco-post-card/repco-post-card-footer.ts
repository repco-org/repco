import DOMPurify from 'dompurify'
import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('repco-post-card-footer')
export class RepcoPostCardFooterElement extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      font-size: 0.875rem;
      color: var(--repco-post-card-footer-color, lightgray);
    }
  `

  @property()
  footer = ''

  override render() {
    return html`${DOMPurify.sanitize(this.footer)
      .trim()
      .replace(/<\/?p>/g, '')}`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'repco-post-card-footer': RepcoPostCardFooterElement
  }
}
