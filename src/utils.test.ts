import * as fs from 'fs'
import * as arc from './kubeconfigs/arc'
import * as def from './kubeconfigs/default'
import {Cluster} from './types/cluster'
import {getKubeconfig, setContext} from './utils'
import {expect, test, describe, vi} from 'vitest'

describe('Utils', () => {
   describe('get kubeconfig', () => {
      test('it gets arc kubeconfig when type is arc', async () => {
         const arcKubeconfig = 'arckubeconfig'
         vi.spyOn(arc, 'getArcKubeconfig').mockImplementation(
            async () => arcKubeconfig
         )

         expect(await getKubeconfig(Cluster.ARC)).toBe(arcKubeconfig)
      })

      test('it defaults to default kubeconfig', async () => {
         const defaultKubeconfig = 'arckubeconfig'
         vi.spyOn(def, 'getDefaultKubeconfig').mockImplementation(
            () => defaultKubeconfig
         )

         expect(await getKubeconfig(undefined)).toBe(defaultKubeconfig)
         expect(await getKubeconfig(Cluster.GENERIC)).toBe(defaultKubeconfig)
      })
   })

   describe('set context', () => {
      const kc = fs.readFileSync('tests/sample-kubeconfig.yml').toString()

      test("it doesn't change kubeconfig without context", () => {
         expect(setContext(kc)).toBe(kc)
      })

      test('it writes the context to the kubeconfig', () => {
         process.env['INPUT_CONTEXT'] = 'example'

         const received = JSON.parse(setContext(kc))
         const expectedKc = JSON.parse(
            fs.readFileSync('tests/expected-kubeconfig.json').toString()
         )

         expect(received).toMatchObject(expectedKc)
      })
   })
})
