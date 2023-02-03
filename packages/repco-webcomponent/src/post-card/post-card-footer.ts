import {css, html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('post-card-footer')
export class PostCardFooterElement extends LitElement {
  static override styles = css`
    :host {
      color: var(--post-footer-color, lightgray);
    }
  `;

  @property()
  footer = '';

  override render() {
    return html`${this.footer}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'post-card-footer': PostCardFooterElement;
  }
}
