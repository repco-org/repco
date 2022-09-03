import { makeProcessSchemaPlugin } from 'graphile-utils'
import { GraphQLSchema, printSchema } from 'graphql'

let SCHEMA: GraphQLSchema | null = null
let SDL: string | null = null

const ExportSchemaPlugin = makeProcessSchemaPlugin((schema) => {
  SCHEMA = schema
  SDL = printSchema(schema)
  return schema
})

export function getSDL() {
  return SDL
}

export function getSchema() {
  return SCHEMA
}

export default ExportSchemaPlugin
