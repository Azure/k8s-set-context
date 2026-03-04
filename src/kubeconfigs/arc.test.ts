import {beforeEach, describe, expect, it, test, vi} from 'vitest'
import * as core from '@actions/core'
import * as actions from '@actions/exec'
import * as io from '@actions/io'
import {getRequiredInputError} from '../../tests/util'
import {getArcKubeconfig, KUBECONFIG_LOCATION} from './arc'
import * as az from './azCommands'

describe('Arc kubeconfig', () => {
   beforeEach(() => {
      vi.restoreAllMocks()
      vi.spyOn(core, 'warning').mockImplementation(() => {})
      vi.spyOn(core, 'debug').mockImplementation(() => {})
   })

   test('it throws error without resource group', async () => {
      await expect(getArcKubeconfig()).rejects.toThrow(
         getRequiredInputError('resource-group')
      )
   })

   test('it throws error without cluster name', async () => {
      process.env['INPUT_RESOURCE-GROUP'] = 'group'
      await expect(getArcKubeconfig()).rejects.toThrow(
         getRequiredInputError('cluster-name')
      )
   })

   describe('runs az cli commands', () => {
      const group = 'group'
      const name = 'name'
      const path = 'path'
      const kubeconfig = 'kubeconfig'

      beforeEach(() => {
         process.env['INPUT_RESOURCE-GROUP'] = group
         process.env['INPUT_CLUSTER-NAME'] = name

         vi.spyOn(io, 'which').mockResolvedValue(path)
         vi.spyOn(az, 'runAzCliCommand').mockResolvedValue()
         vi.spyOn(az, 'runAzKubeconfigCommandBlocking').mockResolvedValue(
            kubeconfig
         )
      })

      it('throws an error without method', async () => {
         await expect(getArcKubeconfig()).rejects.toThrow(
            getRequiredInputError('method')
         )
      })

      describe('service account method', () => {
         beforeEach(() => {
            process.env['INPUT_METHOD'] = 'service-account'
         })

         it('throws an error without token', async () => {
            await expect(getArcKubeconfig()).rejects.toThrow(
               getRequiredInputError('token')
            )
         })

         it('gets the kubeconfig', async () => {
            const token = 'token'
            process.env['INPUT_TOKEN'] = token

            expect(await getArcKubeconfig()).toBe(kubeconfig)
            expect(az.runAzKubeconfigCommandBlocking).toHaveBeenCalledWith(
               path,
               [
                  'connectedk8s',
                  'proxy',
                  '-n',
                  name,
                  '-g',
                  group,
                  '--token',
                  token,
                  '-f',
                  KUBECONFIG_LOCATION
               ],
               KUBECONFIG_LOCATION
            )
         })
      })

      describe('service principal method', () => {
         beforeEach(() => {
            process.env['INPUT_METHOD'] = 'service-principal'
         })

         it('gets the kubeconfig', async () => {
            expect(await getArcKubeconfig()).toBe(kubeconfig)
            expect(az.runAzKubeconfigCommandBlocking).toHaveBeenCalledWith(
               path,
               [
                  'connectedk8s',
                  'proxy',
                  '-n',
                  name,
                  '-g',
                  group,
                  '-f',
                  KUBECONFIG_LOCATION
               ],
               KUBECONFIG_LOCATION
            )
         })
      })
   })
})
