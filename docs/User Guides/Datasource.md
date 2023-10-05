---
title: Create a data source
weight: 2
---

# Implementing a Datasource

A DataSource is an external provider for Repco data. The interface is implemented for individual providers (like CBA, XRCB, media.cccc.de). The DataSource includes methods to fetch data from the external source and converts this data into the Repco data model.

Datasources are configured for each repo seperately. Once enabled, the ds ingest command will fetch and store new content from all datasources withing a repo.

The created datasource can be listed in the CLI, added to a REPO and include content in a repo.

Fetch updates from a data source, using the cursor persisted after the last invocation. All updates will be persisted to the local database. After each page of updates, the current cursor will be saved locally as well.

A cursor may be any string; it's format is left to the datasource itself. Oftenly, you can use a timestamp of the last modification that was ingested. If you need to store more than a single value for a reliable cursor, you may put any stringified JSON into the cursor as well.

## Creating a Datasource

To implement a datasource, a DatasourcePlugin must be created which implements the DataSourcePlugins interface. A DatasourcePlugin returns a `name` and a `uid`. Repco prefers urns as uid.

` {uid: 'urn:repco:datasource:cba', name: 'CBA',}`

Furthermore the actual datasource is created which is responsible for the mapping of the data to the Repco data model. For this the interface DataSource is implemented.

A datasource has a definition consisting of uid, name, and pluginId. Further it provides at least the methods

`fetchUpdates(cursor: string | null): Promise<EntityBatch>   `

`fetchByUID(uid: string): Promise<EntityForm[] | null>   `

`canFetchUID(uid: string): boolean`

For the special case of RSS feeds, we implement a RssDatasourcePlugin.

## Adding a DataSource and fetching updates

Once a DataSource has been created, it can be added to a REPO and its content can be included in the REPO. 
In order to add a DataSource, use the DataSource's uid and a DataSource-specific config given in json and run
```
yarn repco ds add DATASOURCE_UID CONFIG
```
For example, in order to add the peertube channel m.akyel_eurozine.com_channel on displayeurope.video as a DataSource run
```
yarn repco ds add urn:repco:datasource:activitypub '{"user":"m.akyel_eurozine.com_channel", "domain":"displayeurope.video"}'
```
Please note the correct use of single and double quotation marks in the config in order to provide valid json.
This command will also perform an initial ingest.

In order to fetch updates from a DataSource at a later point in time, you can use the ds ingest command, which will fetch and store new content from all DataSources within a REPO.