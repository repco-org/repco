import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('repco-post-card-thumbnail')
export class RepcoPostCardThumbnailElement extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      margin: 10%;
    }

    img {
      height: var(--repco-post-card-thumbnail-height, auto);
      width: var(--repco-post-card-thumbnail-width, auto);
      min-width: var(--repco-post-card-thumbnail-min-width, 10%);
      max-width: var(--repco-post-card-thumbnail-max-width, 150px);
      border-top-left-radius: var(
        --repco-post-card-thumbnail-border-left-radius
      );
      border-bottom-left-radius: var(
        --repco-post-card-thumbnail-border-left-radius
      );
      border-top-right-radius: var(
        --repco-post-card-thumbnail-border-right-radius
      );
      border-bottom-right-radius: var(
        --repco-post-card-thumbnail-border-right-radius
      );
    }
  `

  @property()
  src = ''

  override render() {
    return html`<img src="${this.src}" />`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'repco-post-card-thumbnail': RepcoPostCardThumbnailElement
  }
}
