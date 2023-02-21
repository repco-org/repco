import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('repco-post-card-footer')
export class RepcoPostCardFooterElement extends LitElement {
  static override styles = css`
    :host {
      color: var(--post-footer-color, lightgray);
    }
  `

  @property()
  footer = ''

  override render() {
    return html`${this.footer}`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'repco-post-card-footer': RepcoPostCardFooterElement
  }
}
