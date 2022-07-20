import {getRequiredInputError, getAzCommandError} from '../tests/util'
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
      const AZ_TOOL_NAME: string = 'az'
      // GitHub testrunner was timing out so needed to up the timeout limit
      const extendedTimeout = 17500
      // const cmd: string[] = [
      //    'aks',
      //    'get-credentials',
      //    '--resource-group',
      //    resourceGroup,
      //    '--name',
      //    clusterName,
      //    '-f',
      //    kubeconfigPath
      //    ]
      
//TODO: Check cmd array for --subscription and value in subscription variable
   it('gets the kubeconfig and sets the context with subscription', async () => {      
      jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
         if (inputName == 'resource-group') return resourceGroup
         if (inputName == 'cluster-name') return clusterName
         if (inputName == 'subscription') return subscription
         return ''
      })

      let cmd: string[] = [
         'aks',
         'get-credentials',
         '--resource-group',
         resourceGroup,
         '--name',
         clusterName,
         '-f',
         kubeconfigPath
         ]

      process.env['RUNNER_TEMP'] = runnerTemp
      jest.spyOn(io, 'which').mockImplementation(async () => azPath)
      jest.spyOn(Date, 'now').mockImplementation(() => date)
      jest.spyOn(exec, 'exec').mockImplementation(async () => 0)
      jest.spyOn(fs, 'chmodSync').mockImplementation()
      jest.spyOn(fs, 'writeFileSync').mockImplementation()
      jest.spyOn(core, 'exportVariable').mockImplementation()
      jest.spyOn(core, 'debug').mockImplementation()
      jest.spyOn(utils, 'azSetContext').mockImplementation()

      expect(await run())

      expect(core.exportVariable).toBeCalledWith(expect.stringContaining('KUBECONFIG'), expect.stringContaining(kubeconfigPath))
      expect(cmd).toContain(expect.arrayContaining(...cmd))
      //["aks", "get-credentials", "--resource-group", "sample-rg", "--name", "sample-cluster", "-f", "temp/kubeconfig_1644272184664"]
      //["aks", "get-credentials", "--resource-group", "sample-rg", "--name", "sample-cluster", "-f", "temp/kubeconfig_1644272184664"]
   })

//TODO: Find out if the function on line 115 is even being called in this test and fix it if need be
   it('gets the kubeconfig and sets the context as a non admin user', async () => {
      let cmd: string[] = [
         'aks',
         'get-credentials',
         '--resource-group',
         resourceGroup,
         '--name',
         clusterName,
         '-f',
         kubeconfigPath
         ]

      jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
         if (inputName == 'resource-group') return resourceGroup
         if (inputName == 'cluster-name') return clusterName
         if (inputName == 'subscription') return subscription
         return ''
      })

      process.env['RUNNER_TEMP'] = runnerTemp
      jest.spyOn(io, 'which').mockImplementation(async () => azPath)
      jest.spyOn(Date, 'now').mockImplementation(() => date)
      jest.spyOn(exec, 'exec').mockImplementation(async () => 0)
      jest.spyOn(fs, 'chmodSync').mockImplementation()
      jest.spyOn(fs, 'writeFileSync').mockImplementation()
      jest.spyOn(core, 'exportVariable').mockImplementation()
      jest.spyOn(core, 'debug').mockImplementation()
      jest.spyOn(utils, 'azSetContext').mockImplementation(async () => 1)

      await expect(run())
      await expect(utils.azSetContext(false, kubeconfigPath)).resolves.toEqual(1)
      expect(exec.exec).toHaveBeenCalledWith(
         expect.stringContaining(AZ_TOOL_NAME), 
         expect.arrayContaining(cmd)
      )

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