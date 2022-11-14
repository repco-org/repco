import fs from 'fs'
import esbuild from 'esbuild'

const entryPoints = ['dist/src/cli/bin.js']
const outfile = 'dist/cli-bundle.js'
const metafile = 'dist/cli-bundle.meta.json'
const watch = !!process.argv.find((x) => x === '-w')

const onRebuild = (error, result) => {
  if (error) return console.error('bundle build failed: ', error)
  console.log('bundle build complete. watching for changes...')
  if (result.warnings.length) console.log('Warnings:', result.warnings)
  if (result.errors.length) console.log('Errors:', result.errors)
}

esbuild
  .build({
    entryPoints,
    bundle: true,
    format: 'esm',
    watch: watch && { onRebuild },
    sourcemap: true,
    platform: 'node',
    external: ['@prisma/client', 'classic-level'],
    banner: {
      js: 'import {createRequire} from "module";const require=createRequire(import.meta.url);',
    },
    metafile: !watch,
    outfile,
  })
  .then((result) => {
    if (watch) console.log('watching...')
    else console.log('wrote ' + outfile)
    if (result.metafile) {
      fs.writeFileSync(metafile, JSON.stringify(result.metafile))
    }
  })
  .catch((err) => console.error(err) || process.exit(1))
