import {getRequiredInputError} from '../tests/util'
import {run} from './action'
import fs from 'fs'
import * as utils from './utils'
import {expect, describe, vi, it} from 'vitest'

describe('Run', () => {
   it('throws error without cluster type', async () => {
      await expect(run()).rejects.toThrow(getRequiredInputError('cluster-type'))
   })

   it('writes kubeconfig and sets context', async () => {
      const kubeconfig = 'kubeconfig'

      process.env['INPUT_CLUSTER-TYPE'] = 'default'
      process.env['RUNNER_TEMP'] = '/sample/path'

      vi.spyOn(utils, 'getKubeconfig').mockImplementation(
         async () => kubeconfig
      )

      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
      vi.spyOn(fs, 'chmodSync').mockImplementation(() => {})
      vi.spyOn(utils, 'setContext').mockImplementation(() => kubeconfig)

      expect(await run())
      expect(utils.getKubeconfig).toHaveBeenCalled()
      expect(fs.writeFileSync).toHaveBeenCalled()
      expect(fs.chmodSync).toHaveBeenCalled()
      expect(utils.setContext).toHaveBeenCalled()
   })
})
