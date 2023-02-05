import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

@customElement('repco-post-card-body')
export class RepcoPostCardBodyElement extends LitElement {
  static override styles = css`
    :host {
      flex-grow: 2;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--medium-body-color);
    }
  `

  @property()
  body = ''
  override render() {
    return html`${unsafeHTML(this.body)}`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'repco-post-card-body': RepcoPostCardBodyElement
  }
}
