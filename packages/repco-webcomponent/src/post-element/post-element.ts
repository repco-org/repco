import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import '../post-card/post-card';
import {MediaAssetType, PostType} from './types';

@customElement('post-element')
export class PostElement extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
    }
    :hover {
      background-color: #000000;
      background-color: #f7fafc;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
      border-color: #cbd5e0;
    }
  `;

  @property()
  url = 'https://node1.repco.openaudiosearch.org/graphql';

  @property({type: Number})
  count = 10;

  @property({type: String})
  defaultThumbnail = '';

  @state()
  private _state: {posts: PostType[]} = {posts: []};

  override connectedCallback() {
    super.connectedCallback();
    this.fetchData();
  }

  override render() {
    return html`${this._state.posts.slice(0, this.count).map((post) => {
      let thumbnail = this.defaultThumbnail;
      post.mediaAssets.nodes.map((asset: MediaAssetType) => {
        if (asset.mediaType == 'image') {
          thumbnail = asset.file.contentUrl;
        }
      });

      const header = post.title;
      const subheader = post.uid;

      const body = `${this.trimContent(post.content)}...`;
      const footer = `source: ${this.url}`;
      //TODO: imrove this
      const link = `${this.url.substring(0, this.url.length - 7)}items/${
        post.uid
      }`;

      return html`
        <post-card
          .thumbnail="${thumbnail}"
          .header="${header}"
          .subheader="${subheader}"
          .body="${body}"
          .footer="${footer}"
          @click=${() => this.cardClick(link)}
        ></post-card>
      `;
    })}`;
  }

  private cardClick(url: string) {
    window.open(url, '_blank');
  }

  private async fetchData() {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        query: `
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

`,
      }),
    });
    const json = await response.json();
    const posts = json.data.contentItems.nodes;
    this._state = {posts};
  }

  private trimContent(content: string) {
    return content.slice(0, 106);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'post-element': PostElement;
  }
}
