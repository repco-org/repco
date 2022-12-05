# Implementing a Datasource

A DataSource is an external provider for repco data. The interface is implemented for individual providers (like CBA, XRCB, media.cccc.de). The DataSource includes methods to fetch data from the external source and converts this data into the repco data model.

Datasources are configured for each repo seperately. Once enabled, the ds ingest command will fetch and store new content from all datasources withing a repo.

The created datasource can be listed in the CLI, added to a REPO and include content in a repo.

Fetch updates from a data source, using the cursor persisted after the last invocation. All updates will be persisted to the local database. After each page of updates, the current cursor will be saved locally as well.

A cursor may be any string; it's format is left to the datasource itself. Oftenly, you can use a timestamp of the last modification that was ingested. If you need to store more than a single value for a reliable cursor, you may put any stringified JSON into the cursor as well.

To implement a datasource, a DatasourcePlugin must be created which implements the DataSourcePlugins interface. A DatasourcePlugin returns a `name` and a `uid`. Repco prefers urns as uid.

` {uid: 'urn:repco:datasource:cba', name: 'CBA',}`

Furthermore the actual datasource is created which is responsible for the mapping of the data to the repco data model. For this the interface DataSource is implemented.

A datasource has a definition consisting of uid, name, and pluginId. Further it provides at least the methods

`fetchUpdates(cursor: string | null): Promise<EntityBatch>   `

`fetchByUID(uid: string): Promise<EntityForm[] | null>   `

`canFetchUID(uid: string): boolean`

For the special case of RSS feeds, we implement a RssDatasourcePlugin.

The algorithm works as follows:

- fetch the newest page

- Case A: Oldest date of the page is older than the most recent date of the last fetch. This means that we have caught up with the new elements. We reset to page 0. We are done if this fetch was already on page 0.

- Case B: The oldest date from this page is still newer than the most recent date of the last complete fetch. This means: increase the page number to continue the fetch until we reach the most recent publication date.
