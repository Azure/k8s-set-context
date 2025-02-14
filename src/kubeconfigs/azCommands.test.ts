import * as actions from '@actions/exec'
import {runAzCliCommand} from './azCommands'
import {expect, describe, test, vi} from 'vitest'

describe('Az commands', () => {
   test('it runs an az cli command', async () => {
      const path = 'path'
      const args = ['args']

      vi.spyOn(actions, 'exec').mockImplementation(async () => 0)

      expect(await runAzCliCommand(path, args))
      expect(actions.exec).toBeCalledWith(path, args, {})
   })
})
