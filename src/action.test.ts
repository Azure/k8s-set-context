import {vi, describe, it, expect} from 'vitest'
import {getRequiredInputError} from '../tests/util.js'
import {run} from './action.js'

vi.mock('fs')
vi.mock('./utils.js')

describe('Run', () => {
   it('throws error without cluster type', async () => {
      await expect(run()).rejects.toThrow(getRequiredInputError('cluster-type'))
   })

   it('writes kubeconfig and sets context', async () => {
      const {getKubeconfig, setContext} = await import('./utils.js')
      const fs = await import('fs')
      const kubeconfig = 'kubeconfig'

      process.env['INPUT_CLUSTER-TYPE'] = 'default'
      process.env['RUNNER_TEMP'] = '/sample/path'

      vi.mocked(getKubeconfig).mockResolvedValue(kubeconfig)
      vi.mocked(setContext).mockReturnValue(kubeconfig)
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})
      vi.mocked(fs.chmodSync).mockImplementation(() => {})

      await run()

      expect(getKubeconfig).toHaveBeenCalled()
      expect(fs.writeFileSync).toHaveBeenCalled()
      expect(fs.chmodSync).toHaveBeenCalled()
      expect(setContext).toHaveBeenCalled()
   })
})
