import type { DMMF } from '@prisma/generator-helper'
import {
  CodeBlockWriter,
  ImportDeclarationStructure,
  SourceFile,
  StructureKind,
  VariableDeclarationKind,
} from 'ts-morph'
import { firstLower, hasSkipAnnotation } from './util.js'

export const writeArray = (
  writer: CodeBlockWriter,
  array: string[],
  newLine = true,
) => array.forEach((line) => writer.write(line).conditionalNewLine(newLine))

const SKIP_FIELDS = new Set(['revisionId', 'Revision'])

export function generateZodInputs(
  datamodel: DMMF.Datamodel,
  sourceFile: SourceFile,
) {
  const importList: ImportDeclarationStructure[] = [
    {
      kind: StructureKind.ImportDeclaration,
      namespaceImport: 'z',
      moduleSpecifier: 'zod',
    },
    {
      kind: StructureKind.ImportDeclaration,
      namespaceImport: 'common',
      moduleSpecifier: 'repco-common/zod',
    },
  ]
  const enumFields = datamodel.models
    .map((x) => x.fields)
    .reduce((prev, cur) => [...prev, ...cur], [])
    .filter((f) => f.kind === 'enum')
  importList.push({
    kind: StructureKind.ImportDeclaration,
    namedImports: [...new Set(enumFields.map((f) => f.type))],
    moduleSpecifier: '@prisma/client',
  })

  sourceFile.addImportDeclarations(importList)

  for (const model of datamodel.models) {
    const parserName = firstLower(model.name)
    sourceFile.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      leadingTrivia: (writer) => writer.blankLineIfLastNot(),
      declarations: [
        {
          name: parserName,
          initializer(writer) {
            writer
              .write('z.object(')
              .inlineBlock(() => {
                model.fields
                  .filter((f) => !f.isReadOnly)
                  // remove fields that are explicitly skipped
                  .filter((f) => !SKIP_FIELDS.has(f.name))
                  .filter((f) => !hasSkipAnnotation(f.documentation))
                  .forEach((field) => {
                    writeArray(writer, intoJsDoc(field.documentation))
                    writer
                      .write(`${field.name}: ${getZodConstructor(field)}`)
                      .write(',')
                      .newLine()
                  })
              })
              .write(')')
          },
        },
      ],
    })

    sourceFile.addInterface({
      name: `${model.name}Input`,
      isExported: true,
      extends: [`z.infer<typeof ${firstLower(model.name)}>`],
    })
  }
}

export function getZodConstructor(field: DMMF.Field) {
  let zodType = 'z.unknown()'
  const extraModifiers: string[] = ['']
  if (field.kind === 'scalar') {
    switch (field.type) {
      case 'String':
        if (field.isId) {
          zodType = 'common.uid.nullish()'
        } else {
          zodType = 'z.string()'
        }
        break
      case 'Int':
        zodType = 'z.number()'
        extraModifiers.push('int()')
        break
      case 'BigInt':
        zodType = 'z.bigint()'
        break
      case 'DateTime':
        zodType = 'z.date()'
        break
      case 'Float':
        zodType = 'z.number()'
        break
      case 'Decimal':
        zodType = 'z.number()'
        break
      case 'Json':
        zodType = 'common.json'
        break
      case 'Boolean':
        zodType = 'z.boolean()'
        break
      case 'Bytes':
        zodType = 'common.bytes'
        break
    }
  } else if (field.kind === 'enum') {
    zodType = `z.nativeEnum(${field.type})`
  } else if (field.kind === 'object') {
    if (field.type === 'Revision') {
      zodType = `common.revisionLink`
    } else {
      zodType = `common.link`
    }
  }

  if (field.isList) {
    extraModifiers.push('array()')
  }
  if (!field.isRequired && field.type !== 'Json') {
    extraModifiers.push('nullish()')
  }
  if (field.kind === 'object' && field.isList) {
    extraModifiers.push('optional()')
  }

  // if (field.hasDefaultValue) extraModifiers.push('optional()')
  // if (field.documentation) {
  //   zodType = computeCustomSchema(field.documentation) ?? zodType
  //   extraModifiers.push(...computeModifiers(field.documentation))
  // }

  return `${zodType}${extraModifiers.join('.')}`
}

export const intoJsDoc = (docString?: string) => {
  const lines: string[] = []

  if (docString) {
    const docLines = docString
      .split('\n')
      .filter((dL) => !dL.trimStart().startsWith('@zod'))

    if (docLines.length) {
      lines.push('/**')
      docLines.forEach((dL) => lines.push(` * ${dL}`))
      lines.push(' */')
    }
  }

  return lines
}
