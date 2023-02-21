import './repco-post-card-header.js'
import './repco-post-card-thumbnail.js'
import './repco-post-card-body.js'
import './repco-post-card-footer.js'
import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('repco-post-card')
export class RepcoPostCardElement extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      background-color: var(--repco-post-card-background-color, white);
      border: var(--repco-post-card-border, none);
      border-radius: var(--repco-post-card-border-radius, 0px);
      margin: var(--repco-post-card-margin, 3px);
      box-shadow: var(
        --repco-post-card-shadow,
        rgba(0, 0, 0, 0.15) 0px 1.95px 2.6px
      );
      padding: 2%;
    }

    .right {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      text-overflow: ellipsis;
      min-height: var(--repco-post-card-height, 13em);
    }

    post-card-thumbnail {
      --post-thumbnail-height: var(--repco-post-card-height);
      --post-thumbnail-border-left-radius: var(--repco-post-card-border-radius);
    }

    post-card-header {
      --post-header-color: var(--repco-post-card-header-color);
    }

    post-card-body {
      --post-body-color: var(--repco-post-card-body-color);
    }

    post-card-footer {
      --post-footer-color: var(--repco-post-card-footer-color);
    }
  `
  @property({ type: String })
  customStyles = ''

  @property()
  thumbnail = ''

  @property()
  header = ''

  @property()
  subheader = ''

  @property()
  body = ''

  @property()
  footer = ''

  override render() {
    return html`
      <div class="left">
        <repco-post-card-thumbnail
          .src=${this.thumbnail}
        ></repco-post-card-thumbnail>
      </div>
      <div class="right">
        <repco-post-card-header
          .header="${this.header}"
          .subheader="${this.subheader}"
        ></repco-post-card-header>
        <repco-post-card-body .body="${this.body}"></repco-post-card-body>
        <repco-post-card-footer
          .footer="${this.footer}"
        ></repco-post-card-footer>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'repco-post-card': RepcoPostCardElement
  }
}
