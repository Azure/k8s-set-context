import {getRequiredInputError} from '../tests/util'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {run} from './action'
import * as fs from 'fs'
import * as path from 'path'
import os from 'os'
import * as utils from './utils'
import * as core from '@actions/core'

describe('Run', () => {
   const initialEnv = {...process.env}
   const tempDirs: string[] = []

   beforeEach(() => {
      vi.restoreAllMocks()
      process.env = {...initialEnv}
      vi.spyOn(core, 'warning').mockImplementation(() => {})
      vi.spyOn(core, 'debug').mockImplementation(() => {})
   })

   afterEach(() => {
      tempDirs.forEach((dir) => {
         try {
            fs.rmSync(dir, {recursive: true, force: true})
         } catch {}
      })
      tempDirs.length = 0
   })

   it('throws error without cluster type', async () => {
      await expect(run()).rejects.toThrow(getRequiredInputError('cluster-type'))
   })

   it('writes kubeconfig and sets context', async () => {
      const kubeconfig = 'kubeconfig'
      const fixedTimestamp = 42

      process.env['INPUT_CLUSTER-TYPE'] = 'default'
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kubeconfig-test-'))
      tempDirs.push(tmpDir)
      process.env['RUNNER_TEMP'] = tmpDir

      vi.spyOn(Date, 'now').mockReturnValue(fixedTimestamp)
      vi.spyOn(utils, 'getKubeconfig').mockResolvedValue(kubeconfig)
      vi.spyOn(utils, 'setContext').mockImplementation(() => kubeconfig)

      await expect(run()).resolves.toBeUndefined()

      const outputPath = path.join(tmpDir, `kubeconfig_${fixedTimestamp}`)
      expect(fs.existsSync(outputPath)).toBe(true)
      expect(fs.readFileSync(outputPath, 'utf-8')).toBe(kubeconfig)
      expect(process.env['KUBECONFIG']).toBe(outputPath)
      expect(utils.getKubeconfig).toHaveBeenCalled()
      expect(utils.setContext).toHaveBeenCalledWith(kubeconfig)
   })
})
