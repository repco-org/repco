import { css, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { PostType } from './types.js'

type State = {
  posts: PostType[]
  error?: Error
}

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

  @property({ type: Number })
  count = 10

  @state()
  private _state: State = { posts: [] }

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
          variables: { count: this.count },
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
      console.error(`Failed to fetch data from ${this.endpoint}`, error)
      this._state = { posts: [], error: error as Error }
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
