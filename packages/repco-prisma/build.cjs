require('esbuild').build({
  entryPoints: ['index.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  plugins: [
    {
      name: 'make-all-packages-external',
      setup(build) {
        let filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
        build.onResolve({ filter }, args => ({ path: args.path, external: true }))
      },
    }
  //   name: 'add-js-extension',
  //   setup (build) {
  //     build.onResolve({ filter: /.*/ }, args => {
  //       if (args.kind === 'entry-point') return undefined
  //       console.log('resolve', args)
  //       const external = args.path.indexOf('/') === -1
  //       if (args.importer && args.path.indexOf('/') !== -1 && !args.path.endsWith('.js')) {
  //         return { path: args.path + '.js', external }
  //       } else {
  //         return { path: args.path, external }
  //       }
  //     })
  //   },
  // }]
  ]
}).catch(() => process.exit(1))
