import { esbuildPlugin } from '@web/dev-server-esbuild'

export default {
  open: true,
  watch: true,
  appIndex: './demo/index.html',
  preserveSymlinks: true,
  nodeResolve: true,
  plugins: [esbuildPlugin({ ts: true, target: 'es2020' })],
  esbuildTarget: 'auto',
}
