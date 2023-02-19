/* This code is an example template that can be used to programmatically create a datasource 
that comes from a Wordpress API. It provides all the necessary boilerplate code for creating 
a custom datasource. The code includes type definitions for the datasource, as well as a plugin 
that can be used to create an instance of the datasource.

The datasource uses the zod library for schema validation and undici for making HTTP requests. 
The code defines a class called "yourDatasourceDataSource", which implements the DataSource interface. 
This class has methods for fetching data from the Wordpress API and mapping the results to entity forms.

The code also includes a helper method for parsing URIs that correspond to entities in the Wordpress API, 
as well as methods for constructing URIs that can be used to fetch data from the API. The plugin defined in 
the code can be used to create an instance of the datasource, which can then be used to fetch data from the Wordpress API. */

import * as zod from 'zod'
import { fetch } from 'undici'
import { yourDatasourcePost } from './wpTemplate/types.js'
import {
  DataSource,
  DataSourceDefinition,
  DataSourcePlugin,
  FetchUpdatesResult,
  SourceRecordForm,
} from '../datasource.js'
import { EntityForm } from '../entity.js'
import { FetchOpts } from '../util/datamapping.js'
import { HttpError } from '../util/error.js'

// Define default values for the datasource endpoint and the content type
const DEFAULT_ENDPOINT = 'https://yourDatasource.cat/wp-json/wp/v2'
const CONTENT_TYPE_JSON = 'application/json'

// Define the shape of objects representing forms
export type FormsWithUid = {
  uid: string
  entities: EntityForm[]
}

// Define the schema for the datasource configuration
const configSchema = zod.object({
  endpoint: zod.string().url().optional(),
  apiKey: zod.string().optional(),
})
// Define the inferred type for the schema
type ConfigSchema = zod.infer<typeof configSchema>

// Define the plugin for the datasource
export class yourDatasourceDataSourcePlugin implements DataSourcePlugin {
  // Create an instance of the datasource
  createInstance(config: any) {
    const parsedConfig = configSchema.parse(config)
    return new yourDatasourceDataSource(parsedConfig)
  }
  // Get the definition for the datasource
  get definition() {
    return {
      uid: 'urn:repco:datasource:yourDatasource',
      name: 'yourDatasource',
    }
  }
}

// Define the datasource
export class yourDatasourceDataSource implements DataSource {
  // Define instance variables for the endpoint, endpoint origin, URI prefix, and API key
  endpoint: string
  endpointOrigin: string
  uriPrefix: string
  apiKey?: string

  // Define the constructor, which takes in a configuration object and sets instance variables
  constructor(config: ConfigSchema) {
    // Set the endpoint based on the config or default
    this.endpoint = config.endpoint || DEFAULT_ENDPOINT
    // Set the API key based on the config or environment variable or undefined
    this.apiKey =
      config.apiKey || process.env.yourDatasource_API_KEY || undefined
    // Get the origin from the endpoint
    const endpointUrl = new URL(this.endpoint)
    this.endpointOrigin = endpointUrl.hostname
    // Set the URI prefix
    this.uriPrefix = `repco:yourDatasource:${this.endpointOrigin}`
  }

  // Define a getter for the configuration object
  get config() {
    return { endpoint: this.endpoint, apiKey: this.apiKey }
  }

  // Define a getter for the datasource definition
  get definition(): DataSourceDefinition {
    return {
      name: 'yourDatasource',
      uid: 'urn:datasource:yourDatasource:' + this.endpoint,
      pluginUid: 'urn:repco:datasource:yourDatasource',
    }
  }

  // Define a function to check if a URI can be fetched by the datasource
  canFetchUri(uri: string): boolean {
    const parsed = this.parseUri(uri)
    return !!parsed
  }

  // This method fetches data from your data source by a specified URI.
  async fetchByUri(uri: string): Promise<SourceRecordForm[]> {
    // Parse the URI to retrieve the ID and type of data you want to fetch.
    const parsed = this.parseUri(uri)
    if (!parsed) {
      throw new Error('Invalid URI')
    }

    // Define an endpoint map that maps the data types to endpoint URLs.
    const endpointMap: { [key: string]: string } = {
      post: 'yourPostEndpoint',
    }

    // Retrieve the endpoint URL for the data type from the endpoint map.
    const { id, type } = parsed
    const endpoint = endpointMap[type]

    // Throw an error if the data type is not supported.
    if (!endpoint) {
      throw new Error(
        `Unsupported data type for ${this.definition.name}: ${parsed.type}`,
      )
    }

    // Construct the URL for the data type.
    const url = this._url(`/${endpoint}/${id}`)
    const [body] = await Promise.all([this._fetch(url)])

    // Return an array of source record objects that contain the fetched data.
    return [
      {
        body: JSON.stringify(body),
        contentType: CONTENT_TYPE_JSON,
        sourceType: type,
        sourceUri: url,
      },
    ]
  }

  // Fetches updates for podcasts from a given cursor string and returns a promise containing a `FetchUpdatesResult`.
  async fetchUpdates(cursorString: string | null): Promise<FetchUpdatesResult> {
    // Parse cursor string to JSON object
    const cursor = cursorString ? JSON.parse(cursorString) : {}
    const { posts: postsCursor = '1970-01-01T01:00:00' } = cursor

    // Set pagination parameters and URL for the API request
    const perPage = 100
    const url = this._url(
      `/podcasts?page=1&per_page=${perPage}&_embed&orderby=modified&order=asc&modified_after=${postsCursor}`,
    )

    try {
      // Fetch posts using the URL
      const posts = await this._fetch<yourDatasourcePost[]>(url)

      // Update cursor with the latest modified date
      cursor.posts = posts?.[posts.length - 1]?.modified || cursor.posts

      // Return result in a FetchUpdatesResult object
      return {
        cursor: JSON.stringify(cursor),
        records: [
          {
            body: JSON.stringify(posts),
            contentType: CONTENT_TYPE_JSON,
            sourceType: 'posts',
            sourceUri: url,
          },
        ],
      }
    } catch (error) {
      // Log and re-throw error
      console.error('Error fetching updates:', error)
      throw error
    }
  }

  // Maps a `SourceRecordForm` to an array of `EntityForm` using the body of the record.
  async mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]> {
    // Parse the body of the record
    const body = JSON.parse(record.body)

    // Map the body to an array of `EntityForm` depending on the source type
    switch (record.sourceType) {
      case 'post':
        return this._mapPost(body as yourDatasourcePost)
      default:
        throw new Error('Unknown source type: ' + record.sourceType)
    }
  }

  // Parses a URI string to an object containing the kind, type, and ID of the URI.
  private parseUri(uri: string) {
    // Check if the URI string has the correct prefix
    if (!uri.startsWith(this.uriPrefix + ':')) return null

    // Remove the prefix and split the URI string by the colon separator
    uri = uri.substring(this.uriPrefix.length + 1)
    const parts = uri.split(':')

    // Create an object containing the kind, type, and ID based on the parts of the URI string
    if (parts[0] === 'e') {
      if (parts.length !== 3) return null
      return {
        kind: 'entity',
        type: parts[1],
        id: parts[2],
      }
    } else if (parts[1] === 'r') {
      if (parts.length !== 4) return null
      return {
        kind: 'revision',
        type: parts[1],
        id: parts[2],
        revisionId: parts[3],
      }
    } else {
      return null
    }
  }

  private _uri(type: string, id: string | number): string {
    return `${this.uriPrefix}:e:${type}:${id}`
  }

  // This function retrieves the revision URI for a given type, ID, and revision ID in the datasource.
  private _revisionUri(
    type: string,
    id: string | number,
    revisionId: string | number,
  ): string {
    return `${this.uriPrefix}:r:${type}:${id}:${revisionId}`
  }

  // This function maps a post object from the datasource to an array of entity forms to be sent to the CMS.
  private _mapPost(post: yourDatasourcePost): EntityForm[] {
    try {
      return [
        {
          type: 'ContentItem',
          content: {
            pubDate: new Date(),
            content: post.content,
            contentFormat: 'text/html',
            title: post.title,
            subtitle: '',
            summary: '',
          },
          entityUris: [this._uri('post', post.id)],
          revisionUris: [
            this._revisionUri(
              'post',
              post.id,
              new Date(post.modified).getTime(),
            ),
          ],
        },
      ]
    } catch (error) {
      console.error('Error in _mapPost:', error)
      throw error
    }
  }

  // This function constructs a URL from a given URL string and fetch options object.
  private _url(urlString: string, opts: FetchOpts = {}) {
    const url = new URL(this.endpoint + urlString)
    if (opts.params) {
      for (const [key, value] of Object.entries(opts.params)) {
        url.searchParams.set(key, value)
      }
      opts.params = undefined
    }
    return url.toString()
  }

  // This function performs a fetch request with the given URL and fetch options object, returning the JSON response as a Promise.
  private async _fetch<T = any>(
    urlString: string,
    opts: FetchOpts = {},
  ): Promise<T> {
    const url = new URL(urlString)
    if (this.apiKey) {
      url.searchParams.set('api_key', this.apiKey)
    }
    const res = await fetch(url.toString(), opts)
    if (!res.ok) {
      throw await HttpError.fromResponseJson(res, url)
    }
    const json = await res.json()
    return json as T
  }
}
