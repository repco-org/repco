import { Entity, EntityBatch } from "../datasources/entity";

export interface Datamodel{
    //add Header of our Datamodel
    createRecord(sourceData: Promise<EntityBatch>) : Entity;
    //validate types etc. msy check if data exist
    validate(record: Entity) : Boolean;
    //persist to local database may trigger Adapters/RepcoApi?
    persist(record: Entity) : void;
}