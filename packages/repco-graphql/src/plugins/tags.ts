import { SchemaBuilder } from 'graphile-build'

const FORBIDDEN_TABLES = ['Keypair', '_prisma_migrations']

// Custom tags for repco
// * Do not expose relation tables on their own
// * Hide prisma migrations table
export default function CustomTagsPlugin(builder: SchemaBuilder) {
  builder.hook('build', (build) => {
    const { pgIntrospectionResultsByKind } = build
    pgIntrospectionResultsByKind.class
      .filter((table: any) => table.isSelectable && table.namespace)
      .forEach((table: any) => {
        if (table.name.startsWith('_')) {
          table.tags.omit = 'all,many'
        } else if (table.name === 'Revision') {
          table.tags.omit = 'manyToMany'
        } else {
          // table.tags.omit = 'manyToMany'
        }
        if (FORBIDDEN_TABLES.indexOf(table.name) !== -1) {
          table.tags.omit = true
        }
        if (table.name.startsWith('directus')) {
          table.tags.omit = true
        }
        if (table.name.startsWith('Ap')) {
          table.tags.omit = true
        }
      })
    return build
  })
}
