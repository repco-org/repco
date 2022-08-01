#!/usr/bin/env node

import { generatorHandler } from '@prisma/generator-helper'
import { SemicolonPreference } from 'typescript'
import fs from 'fs/promises'
import { Project } from 'ts-morph'
import { generateTypes } from './generate.js'

generatorHandler({
	onManifest() {
		return {
			// version,
			prettyName: 'Repco Helpers',
			defaultOutput: 'repco',
		}
	},
	async onGenerate(options) {
		console.log('hello')
		const project = new Project()
		const outputPath = options.generator.output!.value

		// const info = {
		//   ...options,
		//   datamodel: null
		// }
		// const json = JSON.stringify(info, null, 2)
		// await fs.writeFile(`${outputPath}/options.json`, json)

		const indexFile = project.createSourceFile(
			`${outputPath}/index.ts`,
			{},
			{ overwrite: true }
		)

		generateTypes(options.dmmf, indexFile)

		indexFile.formatText({
			indentSize: 2,
			convertTabsToSpaces: true,
			indentMultiLineObjectLiteralBeginningOnBlankLine: true,
		})
		await project.save()
		console.log('fin')
	},
})
