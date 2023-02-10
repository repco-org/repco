import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { PostType } from './types'

@customElement('repco-fetch-api')
class RepcoFetchApi extends LitElement {
  static override styles = css`
    :host {
      display: none;
    }
  `
  @property({ type: String })
  endpoint = ''

  @property({ type: String })
  query = ''

  override firstUpdated() {
    this.fetchData()
  }

  @state()
  private _state: { posts: PostType[] } = { posts: [] }

  override connectedCallback() {
    super.connectedCallback()
    this.fetchData()
  }

  async fetchData() {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: this.query,
        }),
      })
      if (!response.ok) {
        throw new Error(
          `Failed to fetch data with status code: ${response.status}`,
        )
      }
      const json = await response.json()
      const posts = json.data.contentItems.nodes
      this._state = { posts }
    } catch (error) {
      console.error(error)
      this._state = { posts: [] }
    }
    this.dispatchEvent(new CustomEvent('data-fetched', { detail: this._state }))
  }

  override render() {
    return html``
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'repco-fetch-api': RepcoFetchApi
  }
}
