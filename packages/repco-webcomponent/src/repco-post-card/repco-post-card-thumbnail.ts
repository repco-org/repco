import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('repco-post-card-thumbnail')
export class RepcoPostCardThumbnailElement extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
    }

    img {
      width: var(--repco-post-card-thumbnail-width, auto);
      min-width: var(--repco-post-card-thumbnail-min-width, 10%);
      max-width: var(--repco-post-card-thumbnail-max-width, 13vh);
      margin: var(--repco-post-card-thumbnail-margin, 0.5rem);
      border-top-left-radius: var(
        --repco-post-card-thumbnail-border-left-radius,
        0
      );
      border-bottom-left-radius: var(
        --repco-post-card-thumbnail-border-left-radius,
        0
      );
      border-top-right-radius: var(
        --repco-post-card-thumbnail-border-right-radius,
        0
      );
      border-bottom-right-radius: var(
        --repco-post-card-thumbnail-border-right-radius,
        0
      );
      object-fit: contain;
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
