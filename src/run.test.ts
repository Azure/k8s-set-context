import {getRequiredInputError} from '../tests/util'
import {run} from './run'
import fs from 'fs'
import * as utils from './utils'
import * as core from '@actions/core'
import * as io from '@actions/io'
import * as exec from '@actions/exec'
import { util } from 'prettier'

describe('Run', () => {
   it('throws error without cluster type', async () => {
      process.env['RUNNER_TEMP'] = '/sample/path'
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

   describe('azSetContext', ()=> {
      const resourceGroup: string = 'sample-rg'
      const clusterName: string = 'sample-cluster'
      const subscription: string = 'subscription-example'
      const azPath: string = 'path'
      const runnerTemp: string = 'temp'
      const date: number = 1644272184664
      const kubeconfigPath = `${runnerTemp}/kubeconfig_${date}`
      const useAZSetContext = 'true'
      const AZ_TOOL_NAME: string = 'az'
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

      it('gets the kubeconfig and sets the context as a non admin user', async () => {            
         process.env['RUNNER_TEMP'] = runnerTemp

         jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
            if (inputName == 'resource-group') return resourceGroup
            if (inputName == 'cluster-name') return clusterName
            if (inputName == 'use-az-set-context') return 'true'
            if (inputName == 'admin') return 'false'
            return ''
         })

         jest.spyOn(io, 'which').mockImplementation(async () => azPath)
         jest.spyOn(Date, 'now').mockImplementation(() => date)
         jest.spyOn(exec, 'exec').mockImplementation(async () => 0)
         jest.spyOn(fs, 'chmodSync').mockImplementation()
         jest.spyOn(fs, 'writeFileSync').mockImplementation()
         jest.spyOn(core, 'exportVariable').mockImplementation()
         jest.spyOn(core, 'debug').mockImplementation()
         jest.spyOn(utils, 'azSetContext').mockImplementation()

         await expect(run())
         await expect(exec.exec).toHaveBeenCalledWith(AZ_TOOL_NAME, cmd)
         await expect(utils.azSetContext).toHaveBeenCalledWith(false, kubeconfigPath)

         
         expect(fs.chmodSync).toBeCalledWith(kubeconfigPath, '600')
         expect(core.exportVariable).toBeCalledWith('KUBECONFIG', kubeconfigPath)
      })

      it('gets the kubeconfig and sets the context as an admin user', async () => {
         process.env['RUNNER_TEMP'] = runnerTemp

         jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
            if (inputName == 'resource-group') return resourceGroup
            if (inputName == 'cluster-name') return clusterName
            if (inputName == 'use-az-set-context') return 'true'
            if (inputName == 'admin') return 'true'
            return ''
         })

         jest.spyOn(io, 'which').mockImplementation(async () => azPath)
         jest.spyOn(Date, 'now').mockImplementation(() => date)
         jest.spyOn(exec, 'exec').mockImplementation(async () => 0)
         jest.spyOn(fs, 'chmodSync').mockImplementation()
         jest.spyOn(fs, 'writeFileSync').mockImplementation()
         jest.spyOn(core, 'exportVariable').mockImplementation()
         jest.spyOn(core, 'debug').mockImplementation()
         jest.spyOn(utils, 'azSetContext').mockImplementation()

         await expect(run())
         await expect(utils.azSetContext).toHaveBeenCalledWith(true, kubeconfigPath)
         await expect(exec.exec).toHaveBeenCalledWith(AZ_TOOL_NAME, cmd.concat(['--admin']))
         
         
         expect(fs.chmodSync).toBeCalledWith(kubeconfigPath, '600')
         expect(core.exportVariable).toBeCalledWith('KUBECONFIG', kubeconfigPath)
      })

      it('gets the kubeconfig and sets the context as a non-admin user with a subscription', async () => {    
         let subCmd: string[] = ['--subscription', subscription]

         process.env['RUNNER_TEMP'] = runnerTemp

         jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
            if (inputName == 'resource-group') return resourceGroup
            if (inputName == 'cluster-name') return clusterName
            if (inputName == 'subscription') return subscription
            if (inputName == 'use-az-set-context') return useAZSetContext
            return ''
         })
         
         jest.spyOn(io, 'which').mockImplementation(async () => azPath)
         jest.spyOn(Date, 'now').mockImplementation(() => date)
         jest.spyOn(exec, 'exec').mockImplementation(async () => 0)
         jest.spyOn(fs, 'chmodSync').mockImplementation()
         jest.spyOn(fs, 'writeFileSync').mockImplementation()
         jest.spyOn(core, 'exportVariable').mockImplementation()
         jest.spyOn(core, 'debug').mockImplementation()
         jest.spyOn(utils, 'azSetContext')

         await expect(run()).resolves
         await expect(exec.exec).toHaveBeenCalledWith(AZ_TOOL_NAME, cmd.concat(subCmd))
         await expect(utils.azSetContext).toHaveBeenCalledWith(false, kubeconfigPath)

         expect(core.getInput).toBeCalled()
   })

      it('gets the kubeconfig and sets the context as an admin user with a subscription', async () => {
         let subAdmCmd: string[] = ['--subscription', subscription, '--admin']

         process.env['RUNNER_TEMP'] = runnerTemp
         
         jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
            if (inputName == 'resource-group') return resourceGroup
            if (inputName == 'cluster-name') return clusterName
            if (inputName == 'use-az-set-context') return 'true'
            if (inputName == 'subscription') return subscription
            if (inputName == 'admin') return 'true'
            return ''
         })
         
         jest.spyOn(io, 'which').mockImplementation(async () => azPath)
         jest.spyOn(Date, 'now').mockImplementation(() => date)
         jest.spyOn(exec, 'exec').mockImplementation(async () => 0)
         jest.spyOn(fs, 'chmodSync').mockImplementation()
         jest.spyOn(fs, 'writeFileSync').mockImplementation()
         jest.spyOn(core, 'exportVariable').mockImplementation()
         jest.spyOn(core, 'debug').mockImplementation()
         jest.spyOn(utils, 'azSetContext')

         await expect(run())
         await expect(exec.exec).toHaveBeenCalledWith(AZ_TOOL_NAME, cmd.concat(subAdmCmd))
         await expect(utils.azSetContext).toHaveBeenCalledWith(true, kubeconfigPath)

         
         expect(fs.chmodSync).toBeCalledWith(kubeconfigPath, '600')
         expect(core.exportVariable).toBeCalledWith('KUBECONFIG', kubeconfigPath)
      })

      it('uses kubelogin if both use-az-set-context and use-kubelogin are set to true', async () => {
         process.env['RUNNER_TEMP'] = runnerTemp

         jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
            if (inputName == 'resource-group') return resourceGroup
            if (inputName == 'cluster-name') return clusterName
            if (inputName == 'use-az-set-context') return 'true'
            if (inputName == 'use-kubelogin') return 'true'
            if (inputName == 'admin') return 'false'
            return ''
         })

         jest.spyOn(io, 'which').mockImplementation(async () => azPath)
         jest.spyOn(Date, 'now').mockImplementation(() => date)
         jest.spyOn(exec, 'exec').mockImplementation(async () => 0)
         jest.spyOn(fs, 'chmodSync').mockImplementation()
         jest.spyOn(fs, 'writeFileSync').mockImplementation()
         jest.spyOn(core, 'exportVariable').mockImplementation()
         jest.spyOn(core, 'debug').mockImplementation()
         jest.spyOn(utils, 'azSetContext')
         jest.spyOn(utils, 'kubeLogin')
   
         await expect(run())
         await expect(exec.exec).toHaveBeenCalledWith(AZ_TOOL_NAME, cmd)
         await expect(utils.azSetContext).toHaveBeenCalledWith(false, kubeconfigPath)
         await expect(utils.kubeLogin).toHaveBeenCalledWith(0)
         
         expect(fs.chmodSync).toBeCalledWith(kubeconfigPath, '600')
         expect(core.exportVariable).toBeCalledWith('KUBECONFIG', kubeconfigPath)
      })
   })
})