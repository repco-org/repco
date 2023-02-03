import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('post-card-thumbnail')
export class PostCardThumbnailElement extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      margin: 10%;
    }

    img {
      height: var(--post-thumbnail-height, auto);
      width: var(--post-thumbnail-width, auto);
      min-width: var(--post-thumbnail-min-width, 10%);
      max-width: var(--post-thumbnail-max-width, 150px);
      border-top-left-radius: var(--post-thumbnail-border-left-radius);
      border-bottom-left-radius: var(--post-thumbnail-border-left-radius);
      border-top-right-radius: var(--post-thumbnail-border-right-radius);
      border-bottom-right-radius: var(--post-thumbnail-border-right-radius);
    }
  `;

  @property()
  src = '';

  override render() {
    return html`<img src="${this.src}" />`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'post-card-thumbnail': PostCardThumbnailElement;
  }
}
