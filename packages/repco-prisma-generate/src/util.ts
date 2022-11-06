import { DMMF } from '@prisma/generator-helper'

export function firstLower(str: string) {
  if (!str) return str
  return str[0].toLowerCase() + str.substring(1)
}

export function isRepcoEntity(model: DMMF.Model) {
  return hasEntityAnnotation(model.documentation)
}

export function findRelations(model: DMMF.Model): DMMF.Field[] {
  return model.fields.filter(
    (field) =>
      field.kind === 'object' &&
      !(
        field.type === 'Revision' &&
        field.relationFromFields &&
        field.relationFromFields[0] === 'revisionId'
      ) &&
      !hasSkipAnnotation(field.documentation),
  )
}

export function hasEntityAnnotation(docstring?: string) {
  if (!docstring) return false
  const lines = docstring.split('\n')
  for (const line of lines) {
    if (line.match(/\s*@repco\(Entity\)\s*/g)) return true
  }
  return false
}

export function hasSkipAnnotation(docstring?: string) {
  if (!docstring) return false
  const lines = docstring.split('\n')
  for (const line of lines) {
    if (line.match(/\s*@repco\(skip\)\s*/g)) return true
  }
  return false
}
