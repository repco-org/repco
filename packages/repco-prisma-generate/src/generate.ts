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
  const imports = ['PrismaPromise', 'Prisma']
  const entityModels = dmmf.datamodel.models.filter(isRepcoEntity)
  // for (const model of entityModels) {
  //   // generateModelTypes(model, file)
  //   imports.push(model.name)
  // }
  file.addImportDeclaration({
    moduleSpecifier: '@prisma/client',
    namedImports: imports,
  })
  file.addImportDeclaration({
    moduleSpecifier: '@prisma/client',
    // namedImports: imports,
    defaultImport: '* as prisma',
  })
  file.addImportDeclaration({
    moduleSpecifier: 'repco-common/zod',
    defaultImport: '* as common',
  })
  file.addImportDeclaration({
    // moduleSpecifier: '../zod/index.js',
    moduleSpecifier: './zod.js',
    defaultImport: '* as form',
  })
  generateEntityTypes(entityModels, file)
  generateParseFunction(entityModels, file)
  generateUpsertFunction(entityModels, file)
  // generateUpsertBatchFunction(entityModels, file)
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

// function generateModelTypes(model: DMMF.Model, file: SourceFile) {
//   const name = model.name
//   const uidFields = findReferences(model)
//   const uidType = (field: DMMF.Field) => (field.isList ? 'string[]' : 'string')
//   const uidFieldTypes = uidFields.map(
//   //   (field) => `${field.name}?: ${uidType(field)};`,
//   // )

//   // const inputDecl = `zod.${model.name}Input`
//   // let inputDecl
//   // if (hasRevisionId(model)) {
//   //   inputDecl = `Omit<Prisma.${name}CreateInput, "revision">`
//   // } else {
//   //   inputDecl = `Prisma.${name}CreateInput`
//   // }
//   // if (uidFieldTypes.length) inputDecl += ` & {\n${uidFieldTypes.join('\n')}\n}`

//   // let outputDecl = name
//   // if (uidFieldTypes.length) outputDecl += ` & {\n${uidFieldTypes.join('\n')}\n}`
//   // file.addTypeAlias({
//   //   name: `${model.name}Input`,
//   //   type: inputDecl,
//   //   isExported: true,
//   // })

//   // file.addTypeAlias({
//   //   name: `${model.name}Output`,
//   //   type: outputDecl,
//   //   isExported: true,
//   // })
// }

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
		// return entity`

  file.addFunction({
    isExported: true,
    name: 'parseEntity',
    parameters: [
      { name: 'type', type: 'string' },
      { name: 'input', type: 'unknown' },
      // { name: 'revisionId', type: 'string', hasQuestionToken: true },
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
    const uidFields = findReferences(model)
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

// function generateUpsertBatchFunction(models: DMMF.Model[], file: SourceFile) {
//   const init = models.map(model => {
//     return `
//     const ${lowerName(model)}Data: Prisma.${model.name}CreateManyInput[] = []
//     const ${lowerName(model)}Ids: string[] = []
//     `
//   }).join('\n')
//   const inner = models.map(model => {
//     const uidFields = findReferences(model)
//     let transform = ''
//     if (uidFields.length) {
//       for (const field of uidFields) {
//         const path = `input.content.${field.name}`
//         let inner, innerPath
//         if (field.isList) {
//           inner = `${path}.filter(link => link.uid).map(link => ({ uid: link.uid }))`
//           innerPath = `(${path}?.length && ${path}[0].uid)`
//         } else {
//           inner = `{ uid: ${path}.uid }`
//           innerPath = `${path}?.uid`
//         }
//         transform += `
//           ${field.name}: ${innerPath} ? { connect: ${inner} } : {},`
//       }
//       return `
//       case '${model.name}': {
//         const data: Prisma.${model.name}CreateManyInput = {
//           ...input.content,
//           uid,
//           Revision: { connect: { id: revisionId }},
//           ${transform}
//           rows.push(data)
//         }
//         ${lowerName(model)}Data.push(data)
//         ${lowerName(model)}Ids.push(uid)
//       }
//       `
//     }
//   })
//   const queries = models.map(model => {
//     return `
//     if (${lowerName(model)}Ids.length) {
//       await prisma[type].deleteMany({
//         where: { uid: { in: ${lowerName(model)}Ids } }
//       })
//     }
//     if (${lowerName(model)}Data.length) {
//       await prisma[type].createMany({
//         data: ${lowerName(model)}Data
//       })
//     }
//     `
//   }).join('\n')
//   const code = `
//     ${init}
//     for (const input of entities) {
//       const type = input.type
//       const uid = input.uid
//       switch (type) {
//         ${inner}
//       }
//     }
//     ${queries}
//   `
//   file.addFunction({
//     isExported: true,
//     isAsync: true,
//     name: 'upsertEntityBatch',
//     parameters: [
//       { name: 'prisma', type: 'Prisma.TransactionClient' },
//       { name: 'entities', type: 'EntityInputWithUidAndRevisionId[]' }
//     ],
//     returnType: 'Promise<void>',
//     statements: code,
//   })
// }

function generateUpsertFunction(models: DMMF.Model[], file: SourceFile) {
  let code = `
	const type = input.type
  switch (type) {
    `

  for (const model of models) {
    const uidFields = findReferences(model)
    let transform = ''
    // This code enables a transformation that would change the input data model to accept
    // ids on the field names without `Uid` suffix. This also changes the prisma data type
    // to the XORed Unchecked input.
    if (uidFields.length) {
      for (const field of uidFields) {
        const path = `input.content.${field.name}`
        // transform += `
        // ${field.name}: undefined,
        // `
        let inner
        let innerPath
        if (field.isList) {
          inner = `${path}.filter(link => link.uid).map(link => ({ uid: link.uid }))`
          innerPath = `(${path}?.length && ${path}[0].uid)`
        } else {
          inner = `{ uid: ${path}.uid }`
          innerPath = `${path}?.uid`
        }
        transform += `
          ${field.name}: ${innerPath} ? { connect: ${inner} } : {},`
      }
    }
    code += `
          // Revision: { connect: { id: revisionId }},
			case '${model.name}': {
        const data = {
          ...input.content,
          uid,
          Revision: { connect: { id: revisionId }},
          ${transform}
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
    // isAsync: true,
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

// function hasRevisionId(model: DMMF.Model): boolean {
//   return !!model.fields.find((field) => field.name === 'revisionId')
// }

function findReferences(model: DMMF.Model): DMMF.Field[] {
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

// function generateUpsertFunction(models: DMMF.Model[], file: SourceFile) {
//   let code = `
//   const type = input.type
//   const uid = input.content.uid
//   switch (type) {`
//   for (const model of models) {
//     const uidFields = findReferences(model)
//     let transform = ``
//     // This code enables a transformation that would change the input data model to accept
//     // ids on the field names without `Uid` suffix. This also changes the prisma data type
//     // to the XORed Unchecked input.
//     if (uidFields.length) {
//       for (const field of uidFields) {
//     //     // if (field.relationFromFields) {
//     //     //   for (const uidFieldName of field.relationFromFields) {
//     //     //     transform += `${uidFieldName}: undefined,`
//     //     //   }
//     //     // }
//         const path = `input.content.${field.name}`
//         transform += `
//         ${field.name}: undefined
//         `
//     //     let inner
//     //     if (field.isList) {
//     //       inner = `${path}?.map(uid => ({ uid }))`
//     //     } else {
//     //       inner = `{ uid: ${path}! }`
//     //     }
//     //     transform += `
//     //       ${field.name}: ${path} ? {
//     //         connect: ${inner}
//     //       } : {},`
//     //   }
//     }
//     code += `
//           // Revision: { connect: { id: revisionId }},
//       case '${model.name}': {
//         const data = {
//           ...input.content,
//           revisionId,
//           ${transform}
//         }
//         return prisma.${lowerName(model)}.upsert({
//           where: { uid },
//           create: data,
//           update: data,
//           select: { uid: true }
//         })
//       }
//       `
//   }
//   code += `
//       default:
//         throw new Error('Unsupported entity type: ' + type)
//     }
//     `
//   file.addFunction({
//     isExported: true,
//     // isAsync: true,
//     name: 'upsertEntity',
//     parameters: [
//       { name: 'prisma', type: 'PrismaClient' },
//       { name: 'input', type: 'EntityInput' },
//       { name: 'revisionId', type: 'string' },
//     ],
//     returnType: 'PrismaPromise<any>',
//     statements: code,
//   })
// }
