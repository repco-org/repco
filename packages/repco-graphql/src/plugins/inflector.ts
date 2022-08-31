// @ts-nocheck

// Custom inflections for repco
// see these files for defaults to adapt:
// * https://github.com/graphile/pg-simplify-inflector/blob/main/index.js
// * https://github.com/graphile-contrib/pg-many-to-many/blob/master/src/PgManyToManyRelationInflectionPlugin.js
export default function InflectorPlugin(builder) {
  builder.hook('inflection', (oldInflection) => {
    // Override some functions used by PgSimplifyInflector
    // These are copy-pasted and changed.
    Object.assign(oldInflection, {
      // Include Uid as suffixes to remove from column names when getting field names.
      getBaseName(columnName: string) {
        const matches = columnName.match(
          /^(.+?)(_row_id|_id|_uid|Uid|_uuid|_fk|_pk|RowId|Id|Uuid|UUID|Fk|Pk)$/,
        )
        if (matches) {
          return matches[1]
        }
        return null
      },
      // Ignore cases when matching on basenames
      baseNameMatches(baseName, otherName) {
        if (baseName) baseName = baseName.toLowerCase()
        if (otherName) otherName = otherName.toLowerCase()
        const singularizedName = this.singularize(otherName)
        return baseName === singularizedName
      },
      // Added some entries to the list of opposites
      getOppositeBaseName(baseName) {
        const replacements = {
          // Changes to this list are breaking changes and will require a
          // major version update, so we need to group as many together as
          // possible! Rather than sending a PR, please look for an open
          // issue called something like "Add more opposites" (if there isn't
          // one then please open it) and add your suggestions to the GitHub
          // comments.
          parent: 'child',
          child: 'parent',
          author: 'authored',
          editor: 'edited',
          reviewer: 'reviewed',
          previous: 'next',
          previousRevision: 'next',
          next: 'previous',
        }
        if (replacements[baseName]) return replacements[baseName]
        return null
        // return this.getBaseName(baseName)
      },
    })

    // Now these are also adapted, but call their parents.
    // These are the actual inflectors that are called to transform and derive the field names
    // from the database structure. Most changes here will be breaking.
    const inflectors = {
      ...oldInflection,
      // Remove Uid from manyRelations field names.
      manyRelationByKeys(detailedKeys, table, foreignTable, constraint) {
        let res = oldInflection.manyRelationByKeys(
          detailedKeys,
          table,
          foreignTable,
          constraint,
        )
        if (res.endsWith('Uid')) res = res.substring(0, res.length - 3)
        // console.log(
        //   'mrbk',
        //   res,
        //   // detailedKeys.map(key => `${key.class.name}.${key.name}`),
        //   // table.name,
        //   // foreignTable.name
        // )
        return res
      },
      // special-case many-to-many names for prisma underscore prefixed junction tables
      manyToManyRelationByKeys(
        leftKeyAttributes,
        junctionLeftKeyAttributes,
        junctionRightKeyAttributes,
        rightKeyAttributes,
        junctionTable,
        rightTable,
        junctionLeftConstraint,
        junctionRightConstraint,
      ) {
        let res
        const junctionTableName = junctionTable.name
        if (junctionRightConstraint.tags.manyToManyFieldName) {
          res = junctionRightConstraint.tags.manyToManyFieldName
        } else if (junctionTableName.startsWith('_')) {
          res = this.camelCase(
            `${this.pluralize(this._singularizedTableName(rightTable))}`,
          )
        } else {
          res = oldInflection.manyToManyRelationByKeys(
            leftKeyAttributes,
            junctionLeftKeyAttributes,
            junctionRightKeyAttributes,
            rightKeyAttributes,
            junctionTable,
            rightTable,
            junctionLeftConstraint,
            junctionRightConstraint,
          )
        }
        return res
      },
      // manyRelationByKeysBackwards(...args) {
      //   const res = oldInflection.manyRelationByKeysBackwards(...args)
      //   return res
      // },
      // singleRelationByKeys(detailedKeys, table, foreignTable, constraint) {
      //   const res = oldInflection.singleRelationByKeys(
      //     detailedKeys,
      //     table,
      //     foreignTable,
      //     constraint,
      //   )
      //   // console.log('srbk', res)
      //   return res
      // },
      // singleRelationByKeysBackwards(
      //   detailedKeys,
      //   table,
      //   foreignTable,
      //   constraint
      // ) {
      //   const res = oldInflection.singleRelationByKeysBackwards(
      //     detailedKeys,
      //     table,
      //     foreignTable,
      //     constraint,
      //   )
      //   // console.log('srbk-b', res)
      //   return res
      // },
    }
    return inflectors
  })
}
