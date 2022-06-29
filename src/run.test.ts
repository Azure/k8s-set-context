import {getRequiredInputError} from '../tests/util'
import * as core from '@actions/core'
import {run} from './run'
import fs from 'fs'
import * as utils from './utils'
import * as io from '@actions/io'
import * as exec from '@actions/exec'

describe('Run', () => {
   it('throws error without cluster type', async () => {
      await expect(run()).rejects.toThrow(getRequiredInputError('cluster-type'))
   })

   it('writes kubeconfig and sets context', async () => {
      const kubeconfig = 'kubeconfig'

      process.env['INPUT_CLUSTER-TYPE'] = 'default'
      process.env['RUNNER_TEMP'] = '/sample/path'

      jest
         .spyOn(utils, 'getKubeconfig')
         .mockImplementation(async () => kubeconfig)
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
      jest.spyOn(fs, 'chmodSync').mockImplementation(() => {})
      jest.spyOn(utils, 'setContext').mockImplementation(() => kubeconfig)

      expect(await run())
      expect(utils.getKubeconfig).toHaveBeenCalled()
      expect(fs.writeFileSync).toHaveBeenCalled()
      expect(fs.chmodSync).toHaveBeenCalled()
      expect(utils.setContext).toHaveBeenCalled()
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
      expect(await utils.azSetContext(true, kubeconfigPath)).toThrowError
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
      await expect(utils.azSetContext(true, kubeconfigPath)).resolves.not.toThrowError()

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
      await expect(utils.azSetContext(true, kubeconfigPath)).resolves.not.toThrowError()

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
      await expect(utils.azSetContext(false, kubeconfigPath)).resolves.not.toThrowError()
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