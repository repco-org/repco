import '../repco-post-card/repco-post-card'
import './repco-fetch-api'
import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { MediaAssetType, PostType } from './types'

@customElement('repco-post-element')
export class RepcoPostElement extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
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
  endpoint = 'https://node1.repco.openaudiosearch.org/graphql'

  @property({ type: String })
  query = `
  query {
    contentItems {
      nodes {
        title
        content
        uid
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
  private _state: { posts: PostType[] } = { posts: [] }

  private _repcoFetchClient: any

  override async firstUpdated() {
    this.fetchData()
  }

  override render() {
    return html` <repco-fetch-api
        .endpoint="${this.endpoint}"
        .query="${this.query}"
      >
      </repco-fetch-api>
      <div
        style="display: flex; flex-direction: ${this.layout === 'horizontal'
          ? 'row'
          : 'column'};"
      >
        ${this._state.posts.slice(0, this.count).map((post) => {
          let thumbnail = this._defaultThumbnail
          post.mediaAssets.nodes.map((asset: MediaAssetType) => {
            if (asset.mediaType == 'image') {
              thumbnail = asset.file.contentUrl
            }
          })

          const header = post.title
          const subheader = post.uid

          const body = `${this.trimContent(post.content)}...`
          const footer = `source: ${this.endpoint}`
          const endpointBase = this.endpoint.substring(
            0,
            this.endpoint.lastIndexOf('/'),
          )
          const link = `${endpointBase}/items/${post.uid}`

          return html`
            <repco-post-card
              class="card"
              .thumbnail="${thumbnail}"
              .header="${header}"
              .subheader="${subheader}"
              .body="${body}"
              .footer="${footer}"
              @click=${() => this.cardClick(link)}
            ></repco-post-card>
          `
        })}
      </div>`
  }

  private async fetchData() {
    if (this.shadowRoot) {
      this._repcoFetchClient =
        this.shadowRoot.querySelector('repco-fetch-client')

      if (this._repcoFetchClient) {
        await this._repcoFetchClient.updateComplete
        this._repcoFetchClient.addEventListener(
          'data-fetched',
          (event: CustomEvent<{ posts: PostType[] }>) => {
            this._state = event.detail
          },
        )
      }
    }
  }
  private cardClick(url: string) {
    window.open(url, '_blank')
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
