import fs from 'fs'
import fsp from 'fs/promises'
import esbuild from 'esbuild'

const entryPoints = ['dist/src/bin.js']
const outfile = 'dist/cli-bundle.js'
const metafile = 'dist/cli-bundle.meta.json'
const watch = !!process.argv.find((x) => x === '-w')

main().catch((err) => console.error(err) || process.exit(1))

async function main() {
  await waitForFile(entryPoints[0])
  const result = await esbuild.build({
    entryPoints,
    bundle: true,
    format: 'esm',
    watch: watch && { onRebuild },
    sourcemap: true,
    platform: 'node',
    external: ['@prisma/client', 'classic-level', 'repco-server'],
    banner: {
      js: 'import {createRequire as __createRequire } from "module";const require=__createRequire(import.meta.url);',
    },
    metafile: !watch,
    outfile,
  })
  if (watch) console.log('watching...')
  else console.log('wrote ' + outfile)
  if (result.metafile) {
    await fsp.writeFile(metafile, JSON.stringify(result.metafile))
  }
}

function onRebuild(error, result) {
  if (error) return console.error('bundle build failed: ', error)
  console.log('bundle build complete. watching for changes...')
  if (result.warnings.length) console.log('Warnings:', result.warnings)
  if (result.errors.length) console.log('Errors:', result.errors)
}

async function waitForFile(path) {
  try {
    await fsp.stat(path)
  } catch (_err) {
    console.log('entry point not found, waiting...')
    await new Promise((resolve) => {
      fs.watchFile(path, (cur, _prev) => {
        if (cur.size !== 0) {
          fs.unwatchFile(path)
          resolve()
        }
      })
    })
  }
}
