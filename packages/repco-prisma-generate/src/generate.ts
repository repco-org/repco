import { DMMF } from '@prisma/generator-helper'
import { SourceFile } from 'ts-morph'
import { isRepcoEntity, hasSkipAnnotation, findRelations } from './util.js'

export function generateTypes(dmmf: DMMF.Document, file: SourceFile) {
  const imports = ['PrismaPromise', 'Prisma']
  const entityModels = dmmf.datamodel.models.filter(isRepcoEntity)
  file.addImportDeclaration({
    moduleSpecifier: '@prisma/client',
    namedImports: imports,
  })
  file.addImportDeclaration({
    moduleSpecifier: '@prisma/client',
    defaultImport: '* as prisma',
  })
  file.addImportDeclaration({
    moduleSpecifier: 'repco-common/zod',
    defaultImport: '* as common',
  })
  file.addImportDeclaration({
    moduleSpecifier: './zod.js',
    defaultImport: '* as form',
  })
  generateEntityTypes(entityModels, file)
  generateParseFunction(entityModels, file)
  generateUpsertFunction(entityModels, file)
  generateExtractRelationsFunction(entityModels, file)
}

function generateEntityTypes(models: DMMF.Model[], file: SourceFile) {
  const inputTys = []
  const outputTys = []
  for (const model of models) {
    if (!isRepcoEntity(model)) continue
    inputTys.push(`{
			type: "${model.name}",
			content: form.${model.name}Input
    }`)
    outputTys.push(`{
			type: "${model.name}",
			content: prisma.${model.name}
    }`)
  }
  file.addTypeAlias({
    name: `EntityInput`,
    type: inputTys.join(' | '),
    isExported: true,
  })
  file.addTypeAlias({
    name: `EntityInputWithUid`,
    type: `EntityInput & { uid: common.Uid }`,
    isExported: true,
  })
  file.addTypeAlias({
    name: `EntityInputWithUidAndRevisionId`,
    type: `EntityInput & { uid: common.Uid, revisionId: string }`,
    isExported: true,
  })
  file.addTypeAlias({
    name: `EntityOutput`,
    type: outputTys.join(' | '),
    isExported: true,
  })
}

function generateParseFunction(models: DMMF.Model[], file: SourceFile) {
  let code = `switch (type) {`
  for (const model of models) {
    const parser = lowerName(model)
    code += `
			case '${model.name}': {
				const content = form.${parser}.parse(input)
				return { type, content } as EntityInput
			}`
  }
  code += `
	   default: {
				throw new Error('Unsupported entity type: ' + type)
	    }
		}
		`

  file.addFunction({
    isExported: true,
    name: 'parseEntity',
    parameters: [
      { name: 'type', type: 'string' },
      { name: 'input', type: 'unknown' },
    ],
    returnType: 'EntityInput',
    statements: code,
  })
}

function generateExtractRelationsFunction(
  models: DMMF.Model[],
  file: SourceFile,
) {
  let code = `
    switch (input.type) {
  `
  for (const model of models) {
    const relationFields = findRelations(model)
    let inner = ``
    if (relationFields.length) {
      for (const field of relationFields) {
        const path = `content.${field.name}`
        const values = field.isList
          ? `${path}.filter(x => x !== null)`
          : `[${path}]`
        inner += `
          if (${path} !== undefined && ${path} !== null) {
            relations.push({
              uid: input.uid,
              type: input.type,
              field: '${field.name}',
              targetType: '${field.type}',
              multiple: ${JSON.stringify(field.isList)},
              values: ${values},
            })
          }
        `
      }
    }
    code += `
			case '${model.name}': {
        const relations: common.Relation[] = []
        const content = input.content as form.${model.name}Input
        ${inner}
        return relations
      }
      `
  }
  code += `
		  default:
				throw new Error('Unsupported entity type: ' + input.type)
		}`
  file.addTypeAlias({
    name: `EntityLike`,
    type: `{
      type: string,
      uid: string,
      content: any,
    }`,
    isExported: true,
  })
  file.addFunction({
    isExported: true,
    isAsync: false,
    name: 'extractRelations',
    parameters: [{ name: 'input', type: 'EntityLike' }],
    returnType: 'common.Relation[]',
    statements: code,
  })
}

function lowerName(model: DMMF.Model): string {
  return model.name[0].toLowerCase() + model.name.substring(1)
}

function generateUpsertFunction(models: DMMF.Model[], file: SourceFile) {
  let code = `
	const type = input.type
  switch (type) {
    `

  for (const model of models) {
    const relationFields = findRelations(model)
    let assignStmt = ''
    // This code enables a declaration that would change the input data model to accept
    // ids on the field names without `Uid` suffix. This also changes the prisma data type
    // to the XORed Unchecked input.
    if (relationFields.length) {
      for (const field of relationFields) {
        const path = `input.content.${field.name}`
        let valueExpr, uidPath
        if (field.isList) {
          valueExpr = `${path}.filter(link => link.uid).map(link => ({ uid: link.uid }))`
          uidPath = `(${path}?.length && ${path}[0].uid)`
        } else {
          valueExpr = `{ uid: ${path}.uid }`
          uidPath = `${path}?.uid`
        }
        assignStmt += `
          ${field.name}: ${uidPath} ? { connect: ${valueExpr} } : {},`
      }
    }
    code += `
			case '${model.name}': {
        const data = {
          ...input.content,
          uid,
          Revision: { connect: { id: revisionId }},
          ${assignStmt}
        }
				return prisma.${lowerName(model)}.upsert({
					where: { uid },
					create: data,
          update: data,
          select: { uid: true }
				})
			}
			`
  }
  code += `
		  default:
				throw new Error('Unsupported entity type: ' + type)
		}
		`
  file.addFunction({
    isExported: true,
    name: 'upsertEntity',
    parameters: [
      { name: 'prisma', type: 'Prisma.TransactionClient' },
      { name: 'uid', type: 'string' },
      { name: 'revisionId', type: 'string' },
      { name: 'input', type: 'EntityInput' },
    ],
    returnType: 'PrismaPromise<any>',
    statements: code,
  })
}

