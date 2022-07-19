import fs from 'fs'
import * as arc from './kubeconfigs/arc'
import * as def from './kubeconfigs/default'
import {Cluster} from './types/cluster'
import {getKubeconfig, setContext, azSetContext} from './utils'
import * as core from '@actions/core'
import * as io from '@actions/io'
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

   describe('azSetContext', ()=> {
      const resourceGroup: string = 'sample-rg'
      const clusterName: string = 'sample-cluster'
      const subscription: string = 'subscription-example'
      const kubeconfigPath: string = "sample-path"
      const azPath: string = 'path'
      const runnerTemp: string = 'temp'
      const date: number = 1644272184664
      const AZ_TOOL_NAME: string = 'az'
      // GitHub testrunner was timing out so needed to up the timeout limit
      const extendedTimeout = 17500
   
      it('throws error when Az cli tools are not installed', async () => {
         
         jest
            .spyOn(io, 'which')
            .mockImplementation(async (tool, check) => {
            if(tool === AZ_TOOL_NAME) return ""
            return ""
         })
         expect(await azSetContext(true, kubeconfigPath)).toThrowError
      })
   
      it('gets the kubeconfig and sets the context', async () => {
         jest.spyOn(core, 'getInput').mockImplementation((inputName, options) => {
            if (inputName == 'resource-group') return resourceGroup
            if (inputName == 'cluster-name') return clusterName
            return ""
         })
         jest.spyOn(io, 'which').mockImplementation(async () => azPath)
         process.env['RUNNER_TEMP'] = runnerTemp
         jest.spyOn(Date, 'now').mockImplementation(() => date)
         jest.spyOn(exec, 'exec').mockImplementation(async () => 0)
         jest.spyOn(fs, 'chmodSync').mockImplementation()
         jest.spyOn(core, 'exportVariable').mockImplementation()
         jest.spyOn(core, 'debug').mockImplementation()
   
         const kubeconfigPath:string = `${runnerTemp}/kubeconfig_${date}`
         await expect(azSetContext(true, kubeconfigPath)).resolves.not.toThrowError()
   
         expect(exec.exec).toBeCalledWith('az', [
            'aks',
            'get-credentials',
            '--resource-group',
            resourceGroup,
            '--name',
            clusterName,
            '-f',
            kubeconfigPath
         ])
         expect(fs.chmodSync).toBeCalledWith(kubeconfigPath, '600')
         expect(core.exportVariable).toBeCalledWith('KUBECONFIG', kubeconfigPath)
      })
   
      it('gets the kubeconfig and sets the context with subscription', async () => {
         
         jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
            if (inputName == 'resource-group') return resourceGroup
            if (inputName == 'cluster-name') return clusterName
            if (inputName == 'subscription') return subscription
            return ''
         })
         
         jest.spyOn(io, 'which').mockImplementation(async () => azPath)
         process.env['RUNNER_TEMP'] = runnerTemp
         jest.spyOn(Date, 'now').mockImplementation(() => date)
         jest.spyOn(exec, 'exec').mockImplementation(async () => 0)
         jest.spyOn(fs, 'chmodSync').mockImplementation()
         jest.spyOn(core, 'exportVariable').mockImplementation()
         jest.spyOn(core, 'debug').mockImplementation()
   
         const kubeconfigPath = `${runnerTemp}/kubeconfig_${date}`
         await expect(azSetContext(true, kubeconfigPath)).resolves.not.toThrowError()
   
         expect(exec.exec).toBeCalledWith('az', [
            'aks',
            'get-credentials',
            '--resource-group',
            resourceGroup,
            '--name',
            clusterName,
            '-f',
            kubeconfigPath,
            '--subscription',
            subscription
         ])
         expect(fs.chmodSync).toBeCalledWith(kubeconfigPath, '600')
         expect(core.exportVariable).toBeCalledWith('KUBECONFIG', kubeconfigPath)
      
      })
   
      it('gets the kubeconfig and sets the context as a non admin user', async () => {
         jest.spyOn(core, 'getInput').mockImplementation((inputName, options) => {
            if (inputName == 'resource-group') return resourceGroup
            if (inputName == 'cluster-name') return clusterName
            if (inputName == 'admin') return 'false'
            if (inputName == 'use-kubelogin') return 'true'
            return ""
         })
         jest.spyOn(io, 'which').mockImplementation(async () => azPath)
         process.env['RUNNER_TEMP'] = runnerTemp
         jest.spyOn(Date, 'now').mockImplementation(() => date)
         jest.spyOn(exec, 'exec').mockImplementation(async () => 0)
         jest.spyOn(fs, 'chmodSync').mockImplementation()
         jest.spyOn(core, 'exportVariable').mockImplementation()
         jest.spyOn(core, 'debug').mockImplementation()
   
         const kubeconfigPath = `${runnerTemp}/kubeconfig_${date}`
         await expect(azSetContext(false, kubeconfigPath)).resolves.not.toThrowError()
         expect(exec.exec).toHaveBeenNthCalledWith(1, 'az', [
            'aks',
            'get-credentials',
            '--resource-group',
            resourceGroup,
            '--name',
            clusterName,
            '-f',
            kubeconfigPath
         ])
         expect(exec.exec).toHaveBeenNthCalledWith(2, 'kubelogin', [
            'convert-kubeconfig',
            '-l',
            'azurecli'
         ])
         expect(fs.chmodSync).toBeCalledWith(kubeconfigPath, '600')
         expect(core.exportVariable).toBeCalledWith('KUBECONFIG', kubeconfigPath)
      })
   
   })
})

