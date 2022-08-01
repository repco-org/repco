#!/usr/bin/env node

import { generatorHandler } from '@prisma/generator-helper'
import { Project } from 'ts-morph'
import { generateTypes } from './generate.js'

generatorHandler({
  onManifest() {
    return {
      // version,
      prettyName: 'Repco Prisma Generator',
      defaultOutput: 'repco',
    }
  },
  async onGenerate(options) {
    const outputPath = options.generator.output?.value
    if (!outputPath) throw new Error('Missing output path')

    const project = new Project()
    const indexFile = project.createSourceFile(
      `${outputPath}/index.ts`,
      {},
      { overwrite: true },
    )

    generateTypes(options.dmmf, indexFile)

    indexFile.formatText({
      indentSize: 2,
      convertTabsToSpaces: true,
      indentMultiLineObjectLiteralBeginningOnBlankLine: true,
    })

    await project.save()

    // snippet to print datamodel and options into a JSON file for debugging.
    // const info = {
    //   ...options,
    //   datamodel: null
    // }
    // const json = JSON.stringify(info, null, 2)
    // await fs.writeFile(`${outputPath}/options.json`, json)
  },
})
