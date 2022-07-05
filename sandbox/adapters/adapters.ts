import { Entity } from "../datasources/entity";

export interface Adapter {
    // send a String to Matrix, Activitypup, etc
    send(data: String):void;
    // recives a String and map the data
    recieve():Entity;
}