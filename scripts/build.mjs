#!/usr/bin/env node

import {build} from 'esbuild'
import {mkdir} from 'fs/promises'
import {dirname} from 'path'

const outFile = 'lib/index.cjs'

const main = async () => {
   await mkdir(dirname(outFile), {recursive: true})
   await build({
      entryPoints: ['src/run.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'cjs',
      sourcemap: true,
      outfile: outFile,
      legalComments: 'none'
   })
}

main().catch((err) => {
   console.error(err)
   process.exit(1)
})
