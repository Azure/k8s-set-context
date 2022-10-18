import fs from 'fs'
import * as arc from './kubeconfigs/arc'
import * as def from './kubeconfigs/default'
import {Cluster} from './types/cluster'
import {getKubeconfig, setContext, kubeLogin} from './utils'
import * as exec from '@actions/exec'

describe('Utils', () => {
   describe('get kubeconfig', () => {
      test('it gets arc kubeconfig when type is arc', async () => {
         const arcKubeconfig = 'arckubeconfig'
         jest
            .spyOn(arc, 'getArcKubeconfig')
            .mockImplementation(async () => arcKubeconfig)

         expect(await getKubeconfig(Cluster.ARC)).toBe(arcKubeconfig)
      })

      test('it defaults to default kubeconfig', async () => {
         const defaultKubeconfig = 'arckubeconfig'
         jest
            .spyOn(def, 'getDefaultKubeconfig')
            .mockImplementation(() => defaultKubeconfig)

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

   describe('kubeLogin', () => {
      test('It throws an Error when KUBELOGIN_EXIT_CODE is not 0', async () => {
         jest.spyOn(exec, 'exec').mockImplementation(async () => 1)

         expect(await kubeLogin).rejects.toThrowError(
            'kubelogin exited with error code 1'
         )
      })
   })
})
