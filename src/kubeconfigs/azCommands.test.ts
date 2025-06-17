import * as actions from '@actions/exec'
import {runAzCliCommand} from './azCommands'

describe('Az commands', () => {
   test('it runs an az cli command', async () => {
      const path = 'path'
      const args = ['args']

      jest.spyOn(actions, 'exec').mockImplementation(async () => 0)

      expect(await runAzCliCommand(path, args))
      expect(actions.exec).toHaveBeenCalledWith(path, args, {})
   })
})
