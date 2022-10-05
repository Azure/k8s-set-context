import {getRequiredInputError} from '../tests/util'
import {run} from './run'
import fs from 'fs'
import * as utils from './utils'
import * as core from '@actions/core'

describe('Run', () => {
   it('throws error without cluster type', async () => {
      await expect(run()).rejects.toThrow(getRequiredInputError('cluster-type'))
   })
   it('writes kubeconfig and sets context', async () => {
      const runnerTemp: string = 'temp'
      process.env['RUNNER_TEMP'] = runnerTemp
      const resourceGroup: string = 'sample-rg'
      const clusterName: string = 'sample-cluster'

      jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
         if (inputName == 'resource-group') return resourceGroup
         if (inputName == 'cluster-name') return clusterName
         if (inputName == 'subscription') return ''
         if (inputName == 'admin') return 'true'
         return ''
      })
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
