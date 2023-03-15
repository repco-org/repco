import '../repco-post-card/repco-post-card.js'
import './repco-fetch-api.js'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import type { MediaAssetType, PostType } from './types.js'

@customElement('repco-post-element')
export class RepcoPostElement extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      font-family: var(--font-family, sans-serif);
    }

    :host.card {
      background-color: var(--card-background-color, #f7fafc);
      box-shadow: var(--card-shadow, 0px 4px 6px rgba(0, 0, 0, 0.1));
      border-color: var(--card-border-color, #cbd5e0);
    }
    .card:hover {
      background-color: #f8f8f8;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
      border-color: #cbd5e0;
    }
    :host([theme='dark']) .card {
      background-color: var(--dark-card-background-color, #383838);
      color: var(--dark-card-color, #f7fafc);
      box-shadow: var(--dark-card-shadow, 0px 4px 6px rgba(0, 0, 0, 0.1));
      border-color: var(--dark-card-border-color, #cbd5e0);
    }
    :host([theme='dark']) .card:hover {
      background-color: var(--dark-card-hover-background-color, #1c1c1c);
      box-shadow: var(--dark-card-hover-shadow, 0px 4px 6px rgba(0, 0, 0, 0.1));
      border-color: var(--dark-card-hover-border-color, #cbd5e0);
    }

    :host > div {
      display: flex;
      flex-direction: column;
    }
    :host > div.horizontal {
      flex-direction: row;
    }
    .card-link {
      text-decoration: none;
      color: inherit;
    }
  `
  @property({ type: String, reflect: true })
  theme = 'light'

  @property({ type: String })
  layout = 'column'

  @property({ type: Number })
  count = 10

  @property({ type: String })
  _defaultThumbnail = ''

  @property()
  endpoint = 'https://hub.repco.openaudiosearch.org/graphql'

  @property({ type: String })
  query = `
  query FetchContentItems($count: Int) {
    contentItems(first: $count) {
      nodes {
        title
        content
        uid
        revision {
          repo {
            name
          }
        }
        mediaAssets {
          nodes {
            mediaType
            file {
              contentUrl
            }
          }
        }
      }
    }
  }
`
  @state()
  private _items: PostType[] = []

  private _fetchClient: any

  override async firstUpdated() {
    if (!this.shadowRoot) throw new Error('missing shadow root')
    this._fetchClient = this.shadowRoot.querySelector('repco-fetch-api')
    this._fetchClient.addEventListener(
      'data-fetched',
      (event: CustomEvent<{ posts: PostType[] }>) =>
        this.updateData(event.detail.posts),
    )
  }

  updateData(data: PostType[]) {
    this._items = [...data]
  }

  override render() {
    const cls = { horizontal: this.layout === 'horizontal' }
    return html` <repco-fetch-api
        .endpoint="${this.endpoint}"
        .query="${this.query}"
        .count="${this.count}"
      >
      </repco-fetch-api>
      <div class=${classMap(cls)}>
        ${this._items.slice(0, this.count).map((post) => {
          let thumbnail = this._defaultThumbnail
          post.mediaAssets.nodes.map((asset: MediaAssetType) => {
            if (asset.mediaType == 'image') {
              thumbnail = asset.file.contentUrl
            }
          })

          const header = post.title
          const body = `${this.trimContent(post.content)}...`
          const footer = `source: ${post.revision?.repo?.name}`
          const endpointBase = this.endpoint.substring(
            0,
            this.endpoint.lastIndexOf('/'),
          )
          const link = `${endpointBase}/items/${post.uid}`

          return html`
            <a href="${link}" target="_blank" class="card-link">
              <repco-post-card
                class="card"
                .thumbnail="${thumbnail}"
                .header="${header}"
                .body="${body}"
                .footer="${footer}"
              ></repco-post-card>
            </a>
          `
        })}
      </div>`
  }

  private trimContent(content: string) {
    return content.slice(0, 106)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'repco-post-element': RepcoPostElement
  }
}
