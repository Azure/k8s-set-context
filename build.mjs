import * as esbuild from 'esbuild'

await esbuild.build({
   entryPoints: ['src/run.ts'],
   bundle: true,
   outfile: 'lib/index.js',
   platform: 'node',
   target: 'node20',
   format: 'esm',
   sourcemap: false,
   minify: false
})
