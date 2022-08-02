import type { DMMF } from '@prisma/generator-helper'
import {
  CodeBlockWriter,
  ImportDeclarationStructure,
  SourceFile,
  StructureKind,
  VariableDeclarationKind,
} from 'ts-morph'

// export function generateZodTypes (model: DMMF.Datamodel, sourceFile: SourceFile) {
//
export const writeArray = (
  writer: CodeBlockWriter,
  array: string[],
  newLine = true,
) => array.forEach((line) => writer.write(line).conditionalNewLine(newLine))

function writeHelpers(sourceFile: SourceFile) {
  sourceFile.addStatements((writer) => {
    writer.newLine()
    writeArray(writer, [
      '// Helper schema for JSON fields',
      `type Literal = boolean | number | string`,
      'type Json = Literal | { [key: string]: Json } | Json[]',
      `const literalSchema = z.union([z.string(), z.number(), z.boolean()])`,
      'const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))',
    ])
  })
  // sourceFile.addStatements((writer) => {
  //   writer.newLine()
  //   writeArray(writer, [
  //     '// Helper schema for Decimal fields',
  //     'z',
  //     '.instanceof(Decimal)',
  //     '.or(z.string())',
  //     '.or(z.number())',
  //     '.refine((value) => {',
  //     '  try {',
  //     '    return new Decimal(value);',
  //     '  } catch (error) {',
  //     '    return false;',
  //     '  }',
  //     '})',
  //     '.transform((value) => new Decimal(value));',
  //   ])
  // })
}

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
  writeHelpers(sourceFile)

  for (const model of datamodel.models) {
    sourceFile.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      leadingTrivia: (writer) => writer.blankLineIfLastNot(),
      declarations: [
        {
          name: model.name + 'Model',
          initializer(writer) {
            writer
              .write('z.object(')
              .inlineBlock(() => {
                model.fields
                  // .filter((f) => f.kind !== 'object')
                  .filter((f) => !f.isReadOnly)
                  .filter((f) => f.name !== 'revisionId')
                  .filter((f) => f.name !== 'revision')
                  .forEach((field) => {
                    writeArray(writer, getJSDocs(field.documentation))
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
      extends: [`z.infer<typeof ${model.name}Model>`],
      // properties: relationFields.map((f) => ({
      //   hasQuestionToken: !f.isRequired,
      //   name: f.name,
      //   type: `Complete${f.type}${f.isList ? '[]' : ''}${!f.isRequired ? ' | null' : ''}`,
      // })),
    })
  }
}

export function getZodConstructor(field: DMMF.Field) {
  let zodType = 'z.unknown()'
  const extraModifiers: string[] = ['']
  if (field.kind === 'scalar') {
    switch (field.type) {
      case 'String':
        zodType = 'z.string()'
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
        zodType = 'jsonSchema'
        break
      case 'Boolean':
        zodType = 'z.boolean()'
        break
      // TODO: Proper type for bytes fields
      case 'Bytes':
        zodType = 'z.unknown()'
        break
    }
  } else if (field.kind === 'enum') {
    zodType = `z.nativeEnum(${field.type})`
  } else if (field.kind === 'object') {
    zodType = `z.string()`
    // zodType = getRelatedModelName(field.type)
  }

  if (field.isList) extraModifiers.push('array()')
  // if (field.documentation) {
  //   zodType = computeCustomSchema(field.documentation) ?? zodType
  //   extraModifiers.push(...computeModifiers(field.documentation))
  // }
  if (
    (!field.isRequired && field.type !== 'Json') ||
    (field.kind === 'object' && field.isList)
  ) {
    extraModifiers.push('nullish()')
  }
  // if (field.hasDefaultValue) extraModifiers.push('optional()')

  return `${zodType}${extraModifiers.join('.')}`
}

export const getJSDocs = (docString?: string) => {
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
