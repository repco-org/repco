import '../repco-post-card/repco-post-card.js'
import './repco-fetch-api.js'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { fetchContentItemsQuery } from './queries' // Import the query from the separate file
import type { MediaAssetType, PostType } from './types.js'

@customElement('repco-post-element')
export class RepcoPostElement extends LitElement {
  static override styles = css`
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :host {
      --font-family: sans-serif;
      --card-background-color: #f7fafc;
      --card-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
      --card-border-color: #cbd5e0;
      --dark-card-background-color: #383838;
      --dark-card-color: #f7fafc;
      --dark-card-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
      --dark-card-border-color: #cbd5e0;
      --dark-card-hover-background-color: #1c1c1c;
      --dark-card-hover-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);

      display: flex;
      flex-direction: column;
      font-family: var(--font-family);
      align-items: center;
      padding: 2rem;
    }

    repco-post-card {
      background-color: var(--card-background-color);
      box-shadow: var(--card-shadow);
      border-color: var(--card-border-color);
      width: 15vw;
      height: 20vh;
      flex: 0 0 auto;
      margin: 0.5rem;
    }

    repco-post-card:hover {
      background-color: #f8f8f8;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
      border-color: #cbd5e0;
    }

    :host([theme='dark']) repco-post-card {
      background-color: var(--dark-card-background-color);
      color: var(--dark-card-color);
      box-shadow: var(--dark-card-shadow);
      border-color: var(--dark-card-border-color);
    }

    :host([theme='dark']) repco-post-card:hover {
      background-color: var(--dark-card-hover-background-color);
      box-shadow: var(--dark-card-hover-shadow);
      border-color: var(--dark-card-hover-border-color);
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
  query = fetchContentItemsQuery

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
          const body = post.content
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
}

declare global {
  interface HTMLElementTagNameMap {
    'repco-post-element': RepcoPostElement
  }
}
