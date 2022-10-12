import { DMMF } from '@prisma/generator-helper'
import { SourceFile } from 'ts-morph'

function hasEntityAnnotation(docstring?: string) {
  if (!docstring) return false
  const lines = docstring.split('\n')
  for (const line of lines) {
    if (line.match(/\s*@repco\(Entity\)\s*/g)) return true
  }
  return false
}

function isRepcoEntity(model: DMMF.Model) {
  return hasEntityAnnotation(model.documentation)
}

export function generateTypes(dmmf: DMMF.Document, file: SourceFile) {
  const imports = ['PrismaClient', 'PrismaPromise', 'Prisma']
  const entityModels = dmmf.datamodel.models.filter(isRepcoEntity)
  for (const model of entityModels) {
    generateModelTypes(model, file)
    imports.push(model.name)
  }
  file.addImportDeclaration({
    moduleSpecifier: '@prisma/client',
    namedImports: imports,
  })
  file.addImportDeclaration({
    // moduleSpecifier: '../zod/index.js',
    moduleSpecifier: './zod.js',
    defaultImport: '* as zod',
  })
  generateEntityTypes(entityModels, file)
  generateValidateFunction(entityModels, file)
  generateUpsertFunction(entityModels, file)
  generateUpsertFunction2(entityModels, file)
  generateExtractRelationsFunction(entityModels, file)
}

function generateEntityTypes(models: DMMF.Model[], file: SourceFile) {
  const inputTys = []
  const outputTys = []
  for (const model of models) {
    if (!isRepcoEntity(model)) continue
    inputTys.push(`{
			type: "${model.name}",
			content: ${model.name}Input
    }`)
    outputTys.push(`{
			type: "${model.name}",
			content: ${model.name}Output
    }`)
  }
  file.addTypeAlias({
    name: `EntityInput`,
    type: inputTys.join(' | '),
    isExported: true,
  })
  file.addTypeAlias({
    name: `EntityOutput`,
    type: outputTys.join(' | '),
    isExported: true,
  })
}

function generateModelTypes(model: DMMF.Model, file: SourceFile) {
  const name = model.name
  const uidFields = findUidFields(model)
  const uidType = (field: DMMF.Field) => (field.isList ? 'string[]' : 'string')
  const uidFieldTypes = uidFields.map(
    (field) => `${field.name}?: ${uidType(field)};`,
  )

  const inputDecl = `zod.${model.name}Input`
  // let inputDecl
  // if (hasRevisionId(model)) {
  //   inputDecl = `Omit<Prisma.${name}CreateInput, "revision">`
  // } else {
  //   inputDecl = `Prisma.${name}CreateInput`
  // }
  // if (uidFieldTypes.length) inputDecl += ` & {\n${uidFieldTypes.join('\n')}\n}`

  let outputDecl = name
  if (uidFieldTypes.length) outputDecl += ` & {\n${uidFieldTypes.join('\n')}\n}`

  file.addTypeAlias({
    name: `${model.name}Input`,
    type: inputDecl,
    isExported: true,
  })

  file.addTypeAlias({
    name: `${model.name}Output`,
    type: outputDecl,
    isExported: true,
  })
}

function generateValidateFunction(models: DMMF.Model[], file: SourceFile) {
  let code = `input.revisionId = revisionId
		switch (type) {`
  for (const model of models) {
    code += `
			case '${model.name}': {
				zod.${model.name}Model.parse(input)
				return { type, content: input } as EntityInput
			}`
  }
  code += `
	   default: {
				throw new Error('Unsupported entity type: ' + type)
	    }
		}
		// return entity`

  file.addFunction({
    isExported: true,
    name: 'validateEntity',
    parameters: [
      { name: 'type', type: 'string' },
      { name: 'input', type: 'any' },
      { name: 'revisionId', type: 'string', hasQuestionToken: true },
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
    const type = input.type
    const uid = input.content.uid
    switch (type) {
  `
  for (const model of models) {
    const uidFields = findUidFields(model)
    let inner = ``
    if (uidFields.length) {
      for (const field of uidFields) {
        const path = `content.${field.name}`
        const values = field.isList
          ? `${path}.filter(x => x !== null)`
          : `[${path}]`
        inner += `
          if (${path} !== undefined && ${path} !== null) {
            relations.push({
              fieldName: '${field.name}',
              targetType: '${field.type}',
              isList: ${JSON.stringify(field.isList)},
              values: ${values}
            })
          }
        `
      }
    }
    code += `
			case '${model.name}': {
        const relations: Relation[] = []
        const content = input.content as ${model.name}Input
        ${inner}
        return relations
      }
      `
  }
  code += `
		  default:
				throw new Error('Unsupported entity type: ' + type)
		}`
  file.addTypeAlias({
    name: `Relation`,
    type: `{
      fieldName: string,
      targetType: string,
      values?: string[],
      isList: boolean
    }`,
    isExported: true,
  })
  file.addTypeAlias({
    name: `EntityLike`,
    type: `{
      type: string,
      content: {
        uid: string
      },
    }`,
    isExported: true,
  })
  file.addFunction({
    isExported: true,
    isAsync: false,
    name: 'extractRelations',
    parameters: [{ name: 'input', type: 'EntityLike' }],
    returnType: 'Relation[]',
    statements: code,
  })
}

function lowerName(model: DMMF.Model): string {
  return model.name[0].toLowerCase() + model.name.substring(1)
}

function generateUpsertFunction(models: DMMF.Model[], file: SourceFile) {
  let code = `
	const type = input.type
	const uid = input.content.uid
	let entity: EntityOutput
	switch (type) {`
  for (const model of models) {
    const uidFields = findUidFields(model)
    let transform = ``
    if (uidFields.length) {
      for (const field of uidFields) {
        // if (field.relationFromFields) {
        //   for (const uidFieldName of field.relationFromFields) {
        //     transform += `${uidFieldName}: undefined,`
        //   }
        // }
        const path = `input.content.${field.name}`
        let inner
        if (field.isList) {
          inner = `${path}?.map(uid => ({ uid }))`
        } else {
          inner = `{ uid: ${path}! }`
        }
        transform += `
					${field.name}: ${path} ? {
						connect: ${inner}
          } : {},`
      }
    }
    code += `
			case '${model.name}': {
        const data = {
          ...input.content,
          revisionId: undefined,
          revision: { create: revision },
          ${transform}
        }
				const content = await prisma.${lowerName(model)}.upsert({
					where: { uid },
					create: data,
					update: data
				})
				entity = { type, content }
				break;
			}
			`
  }
  code += `
		  default:
				throw new Error('Unsupported entity type: ' + type)
		}
		return entity`
  file.addFunction({
    isExported: true,
    isAsync: true,
    name: 'upsertEntity',
    parameters: [
      { name: 'prisma', type: 'PrismaClient' },
      { name: 'input', type: 'EntityInput' },
      { name: 'revision', type: 'Prisma.RevisionCreateInput' },
    ],
    returnType: 'Promise<EntityOutput>',
    statements: code,
  })
}

function generateUpsertFunction2(models: DMMF.Model[], file: SourceFile) {
  let code = `
	const type = input.type
	const uid = input.content.uid
	switch (type) {`
  for (const model of models) {
    const uidFields = findUidFields(model)
    let transform = ``
    if (uidFields.length) {
      for (const field of uidFields) {
        // if (field.relationFromFields) {
        //   for (const uidFieldName of field.relationFromFields) {
        //     transform += `${uidFieldName}: undefined,`
        //   }
        // }
        const path = `input.content.${field.name}`
        let inner
        if (field.isList) {
          inner = `${path}?.map(uid => ({ uid }))`
        } else {
          inner = `{ uid: ${path}! }`
        }
        transform += `
					${field.name}: ${path} ? {
						connect: ${inner}
          } : {},`
      }
    }
    code += `
			case '${model.name}': {
        const data = {
          ...input.content,
          revision: { connect: { id: revisionId }},
          ${transform}
        }
				return prisma.${lowerName(model)}.upsert({
					where: { uid },
					create: data,
          update: data,
          select: {}
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
    // isAsync: true,
    name: 'upsertEntity2',
    parameters: [
      { name: 'prisma', type: 'PrismaClient' },
      { name: 'input', type: 'EntityInput' },
      { name: 'revisionId', type: 'string' },
    ],
    returnType: 'PrismaPromise<any>',
    statements: code,
  })
}

// function hasRevisionId(model: DMMF.Model): boolean {
//   return !!model.fields.find((field) => field.name === 'revisionId')
// }

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
