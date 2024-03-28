import { makeWrapResolversPlugin } from 'graphile-utils'
import type { GraphQLField } from 'graphql'

// Adds some validation logic for pagination arguments:
// - first/last may not be higher than 100
// - if no pagination args are set, default to first 10
// TODO: Decide if the latter is not too much in conflict with the spec
// https://relay.dev/graphql/connections.htm#sec-Pagination-algorithm
// Maybe default to error. Breaking change so decide before release.
const WrapResolversPlugin = makeWrapResolversPlugin(
  (context) => {
    const scope = context.scope
    // I *think* this means that we do a select many query.
    if (scope.isPgFieldConnection) {
      return { scope }
    }
    return null
  },
  ({ scope }) =>
    async (resolver, _user, args, _context, resolveInfo) => {
      const fieldName = scope.fieldName
      const rootField = resolveInfo.schema.getQueryType()?.getFields()[
        fieldName
      ]
      if (rootField && hasPaginationArgs(rootField as any)) {
        if (args.first >= 100) {
          throw new Error('Argument `first` may not be larger than 100')
        }
        if (args.last >= 100) {
          throw new Error('Argument `last` may not be larger than 100')
        }
        if (
          args.first === undefined &&
          args.last === undefined &&
          args.before === undefined &&
          args.after === undefined
        ) {
          args.first = 10
          // Alternative: Throw an error if neither first nor last arguments are set.
          // throw new Error('Either `first` or `last` argument is required.')
        } else if (args.first === undefined && args.last === undefined) {
          throw new Error('Either `first` or `last` argument is required.')
        }
      }
      // @ts-ignore
      const result = await resolver()
      return result
    },
)

function hasPaginationArgs(field: GraphQLField<any, any>): boolean {
  const requiredArgs = new Set(['first', 'last', 'before', 'after'])
  for (const arg of field.args) {
    requiredArgs.delete(arg.name)
  }
  return requiredArgs.size === 0
}

export default WrapResolversPlugin
