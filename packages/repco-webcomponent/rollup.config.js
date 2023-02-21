import esbuild from 'rollup-plugin-esbuild'
import nodeResolve from '@rollup/plugin-node-resolve'
import { rollupPluginHTML as html } from '@web/rollup-plugin-html'

const name = 'repco-webcomponent'
const input = 'src/index.ts'
const esbuildOpts = { minify: true }

export default [
  // build a ESM bundle that does not include our external dependencies
  {
    input,
    plugins: [esbuild(esbuildOpts)],
    external: [/^lit(\/.*)?/, 'dompurify'],
    output: [
      {
        file: `dist/${name}.esm.js`,
        format: 'es',
      },
    ],
  },
  // build a ESM bundle that includes all external dependencies
  {
    input,
    plugins: [esbuild(esbuildOpts), nodeResolve()],
    output: [
      {
        file: `dist/${name}.bundle.esm.js`,
        format: 'es',
      },
    ],
  },
  // build the demo HTML for publication
  {
    input: ['demo/*.html'],
    output: { dir: 'dist/demo' },
    plugins: [html(), esbuild(esbuildOpts), nodeResolve()],
  },
]
