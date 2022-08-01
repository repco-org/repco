import { Entity } from '../entity.js'

export interface Adapter {
  // send a String to Matrix, Activitypup, etc
  send(data: string): void
  // receives a String and map the data
  receive(): Entity
}
