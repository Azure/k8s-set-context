import fs from 'fs'
import * as arc from './kubeconfigs/arc'
import * as def from './kubeconfigs/default'
import {Cluster} from './types/cluster'
import {getKubeconfig, setContext, azSetContext} from './utils'
import * as io from '@actions/io'
import * as exec from '@actions/exec'
import {getAzCommandError} from '../tests/util'
import * as core from '@actions/core'

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

   describe('azSetContext', () => {
      const resourceGroup: string = 'sample-rg'
      const clusterName: string = 'sample-cluster'
      const subscription: string = 'subscription-example'
      const azPath: string = 'path'
      const runnerTemp: string = 'temp'
      const date: number = 1644272184664
      const AZ_TOOL_NAME: string = 'az'
      const kubeconfigPath: string = `${runnerTemp}/kubeconfig_${date}`
      const cmd: string[] = [
         'aks',
         'get-credentials',
         '--resource-group',
         resourceGroup,
         '--name',
         clusterName,
         '-f',
         kubeconfigPath
      ]

      it('throws error when Az cli tools are not installed', async () => {
         jest
            .spyOn(core, 'getInput')
            .mockImplementation((inputName: string) => {
               if (inputName == 'resource-group') return resourceGroup
               if (inputName == 'cluster-name') return clusterName
               if (inputName == 'subscription') return subscription
               if (inputName == 'use-az-set-context') return 'true'
               if (inputName == 'admin') return 'false'
               return ''
            })
         jest.spyOn(io, 'which').mockImplementation(async (tool, check) => {
            if (tool === AZ_TOOL_NAME) return ''
            return ''
         })
         await expect(azSetContext(true, kubeconfigPath, resourceGroup, clusterName, subscription)).rejects.toThrowError(
            getAzCommandError()
         )
      })

      it('gets the kubeconfig via az command', async () => {
         jest
            .spyOn(core, 'getInput')
            .mockImplementation((inputName, options) => {
               if (inputName == 'resource-group') return resourceGroup
               if (inputName == 'cluster-name') return clusterName
               return ''
            })
         jest.spyOn(io, 'which').mockImplementation(async () => azPath)
         process.env['RUNNER_TEMP'] = runnerTemp
         jest.spyOn(Date, 'now').mockImplementation(() => date)
         jest.spyOn(exec, 'exec').mockImplementation(async () => 0)
         jest.spyOn(fs, 'chmodSync').mockImplementation()
         jest.spyOn(core, 'debug').mockImplementation()

         await expect(
            azSetContext(true, kubeconfigPath, resourceGroup, clusterName, subscription)
         ).resolves.not.toThrowError()

         expect(exec.exec).toBeCalledWith(
            expect.stringContaining(AZ_TOOL_NAME),
            expect.arrayContaining(cmd)
         )
      })
   })
})
