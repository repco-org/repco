import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('repco-post-card-header')
export class RepcoPostCardHeaderElement extends LitElement {
  static override styles = css`
    :host {
      flex-grow: 1;
      color: var(--repco-post-card-header-color);
    }

    h2,
    h3 {
      margin: 0;
      /* color: var(--post-header-color, #5657f6); */
    }
    i {
      font-size: 0.875rem;
    }
  `

  @property()
  header = ''

  @property()
  subheader = ''

  override render() {
    return html`
      <h2>${this.header}</h2>
      <i>${this.subheader}</i>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'repco-post-card-header': RepcoPostCardHeaderElement
  }
}
