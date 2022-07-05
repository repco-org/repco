import { UID } from "./shared.js";
import { EntityBatch } from "./entity.js";
import { HttpError } from "./helpers/httpErrors.js";


export type DataSourceDefinition = {
  // The unique ID for this data source instance.
  uid: UID,
  // The human-readable name of the data source instance (e.g. "CBA")
  name: string,
  // A primary endpoint URL for this data source.
  url: string
}

/**
 * Static methods on a DataSource class.
 */
export interface DataSourceStatic {
  createInstance (url: string): Promise<DataSource>;
}

/**
 * A DataSource is an external provider for repco data. 
 *
 * The interface is implemented for individual providers (like CBA, XRCB, media.cccc.de). 
 * The DataSource includes methods to fetch data from the external source
 * and converts this data into the repco data model.
 */
export interface DataSource {
  // get definition (): DataSourceDefinition;
  fetchUpdates(cursor: string | null): Promise<EntityBatch>;
  urn (type: string, id: string | number): string;
  // fetchByUID(uid: string): Promise<Entity>;
}

