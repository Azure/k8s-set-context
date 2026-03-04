import {describe, expect, test, vi} from 'vitest'
import * as core from '@actions/core'
import * as actions from '@actions/exec'
import {runAzCliCommand} from './azCommands'

describe('Az commands', () => {
   test('it runs an az cli command', async () => {
      vi.spyOn(core, 'debug').mockImplementation(() => {})
      const path = 'path'
      const args = ['args']

      vi.spyOn(actions, 'exec').mockResolvedValue(0)

      expect(await runAzCliCommand(path, args))
      expect(actions.exec).toHaveBeenCalledWith(path, args, {})
   })
})
