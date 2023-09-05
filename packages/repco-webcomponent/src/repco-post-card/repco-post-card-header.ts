import DOMPurify from 'dompurify'
import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('repco-post-card-header')
export class RepcoPostCardHeaderElement extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      color: var(--repco-post-card-header-color);
      flex-grow: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    h2,
    i {
      margin: 0;
      padding: 0.25rem 0;
    }

    h2 {
      font-size: 1.2rem;
      margin: 0;
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
    return html`<h2>
        ${DOMPurify.sanitize(this.header)
          .trim()
          .replace(/<\/?p>/g, '')
          .replace(/&#\d+;/g, '')}
      </h2>
      <i
        >${DOMPurify.sanitize(this.subheader)
          .trim()
          .replace(/<\/?p>/g, '')
          .replace(/&#\d+;/g, '')}</i
      >`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'repco-post-card-header': RepcoPostCardHeaderElement
  }
}
