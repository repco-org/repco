import { DMMF } from '@prisma/generator-helper'

export function firstLower(str: string) {
  if (!str) return str
  return str[0].toLowerCase() + str.substring(1)
}

function findUidFields(model: DMMF.Model): DMMF.Field[] {
  const res = []
  for (const field of model.fields) {
    if (
      field.kind === 'object' &&
      field.type !== 'Revision'
      // && field.isList
      // && field.relationToFields?.length
      // && field.relationToFields[0] === 'uid'
    ) {
      res.push(field)
    }
  }
  return res
}
