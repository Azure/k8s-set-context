import {vi, describe, test, expect, beforeEach} from 'vitest'
import * as actions from '@actions/exec'
import {runAzCliCommand} from './azCommands.js'

vi.mock('@actions/exec')

describe('Az commands', () => {
   test('it runs an az cli command', async () => {
      const path = 'path'
      const args = ['args']

      vi.mocked(actions.exec).mockResolvedValue(0)

      await runAzCliCommand(path, args)
      expect(actions.exec).toHaveBeenCalledWith(path, args, {})
   })
})
