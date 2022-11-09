import fs from 'fs'
import esbuild from 'esbuild'

const outfile = 'dist/cli-bundle.js'
const watch = !!process.argv.find((x) => x === '-w')
const onRebuild = (error, result) => {
  if (error) console.error('bundle build failed: ', error)
  else console.log('bundle build complete. watching for changes.')
  if (result.warnings.length) console.log('Warnings: \n' + result.warnings.map(x => '* ' + x).join('\n'))
  if (result.errors.length) console.log('Errors: \n' + result.errors.map(x => '* ' + x).join('\n'))
}
esbuild
  .build({
    entryPoints: ['dist/src/cli/bin.js'],
    bundle: true,
    format: 'esm',
    watch: watch && { onRebuild },
    platform: 'node',
    external: ['@prisma/client', 'classic-level'],
    banner: {
      js: "import {createRequire} from 'module';const require=createRequire(import.meta.url);",
    },
    metafile: !watch,
    outfile,
  })
  .then((result) => {
    if (watch) console.log('watching...')
    else console.log('wrote ' + outfile)
    if (result.metafile) {
      fs.writeFileSync(
        'dist/cli-bundle.meta.json',
        JSON.stringify(result.metafile),
      )
    }
  })
  .catch((err) => console.error(err) || process.exit(1))
