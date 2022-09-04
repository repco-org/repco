#!/bin/env node

import fs from 'fs/promises'

main().catch(console.error)

async function readPfile (pname, fname) {
  const path = `./packages/${pname}/${fname}`
  return JSON.parse((await fs.readFile(path)).toString())
}

async function writePfile (pname, fname, content) {
  const path = `./packages/${pname}/${fname}`
  const buf = Buffer.from(JSON.stringify(content, null, 2))
  return await fs.writeFile(path, buf)
}

async function main () {
  const list = await fs.readdir('./packages')
  for (const name of list) {
    console.log('read name', name)
    const pspec = await readPfile(name, 'package.json')
    const tspec = await readPfile(name, 'tsconfig.json')
    const pdeps = []
    if (pspec.dependencies) {
      for (const [name, _version] of Object.entries(pspec.dependencies)) {
        if (list.indexOf(name) !== -1) pdeps.push(name)
      }
    }
    if (pdeps.length) {
      const referencePaths = pdeps.map(name => `../${name}`)
      tspec.references = referencePaths.map(path => ({ path }))
      await writePfile(name, 'tsconfig.json', tspec)
    }
  }
  const rootTspec = JSON.parse((await fs.readFile('./tsconfig.json')).toString())
  rootTspec.references = list.map((name) => ({ path: `./packages/${name}` }))
  await fs.writeFile('./tsconfig.json', JSON.stringify(rootTspec, null, 2))
  console.log('done')
}
