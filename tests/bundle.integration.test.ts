import {afterEach, beforeAll, describe, expect, test} from 'vitest'
import {execFile} from 'child_process'
import {promisify} from 'util'
import {mkdtempSync, readFileSync, rmSync} from 'fs'
import path from 'path'
import os from 'os'

const execFileAsync = promisify(execFile)

const sampleKubeconfig = `apiVersion: v1
clusters:
  - cluster:
      server: https://example.com
    name: primary
contexts:
  - context:
      cluster: primary
      namespace: default
      user: developer
    name: exp-scratch
current-context: exp-scratch
kind: Config
preferences: {}
users:
  - name: developer
    user:
      username: exp
      password: pass
`

describe('Action bundle integration', () => {
   beforeAll(async () => {
      await execFileAsync('node', ['./scripts/build.mjs'])
   }, 20000)

   const createdDirs: string[] = []

   afterEach(() => {
      while (createdDirs.length) {
         const dir = createdDirs.pop()
         if (dir) {
            rmSync(dir, {recursive: true, force: true})
         }
      }
   })

   test('bundle sets kubeconfig as workflow would', async () => {
      const runnerTemp = mkdtempSync(path.join(os.tmpdir(), 'bundle-test-'))
      createdDirs.push(runnerTemp)

      const env = {
         ...process.env,
         RUNNER_TEMP: runnerTemp,
         GITHUB_ACTIONS: 'true',
         'INPUT_CLUSTER-TYPE': 'generic',
         INPUT_METHOD: 'kubeconfig',
         INPUT_KUBECONFIG: sampleKubeconfig,
         INPUT_CONTEXT: 'exp-scratch'
      }

      const {stdout} = await execFileAsync('node', ['lib/index.cjs'], {
         env
      })

      const output = stdout?.toString() ?? ''
      const match = output.match(/::set-env name=KUBECONFIG::(.+)/)
      expect(match?.[1]).toBeTruthy()
      const kubeconfigPath = match![1].trim()
      const contents = JSON.parse(readFileSync(kubeconfigPath, 'utf-8'))

      expect(contents['current-context']).toBe('exp-scratch')
      expect(contents.clusters[0].cluster.server).toBe('https://example.com')
   }, 20000)
})
