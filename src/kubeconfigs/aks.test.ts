import * as io from '@actions/io'
import * as exec from '@actions/exec'
import * as core from '@actions/core'
import fs from 'fs'
import * as aks from './aks'
import * as az from './azCommands'
import {KUBECONFIG_LOCATION} from './aks'
import * as utils from '../utils'
import {Method} from '../types/method'

describe('AKS kubeconfig', () => {
   const resourceGroup: string = 'sample-rg'
   const clusterName: string = 'sample-cluster'
   const subscription: string = 'subscription-example'
   const azPath: string = 'path'
   const date: number = 1644272184664
   const kubeconfig = 'kubeconfig'
   const cmd: string[] = [
      'aks',
      'get-credentials',
      '-g',
      resourceGroup,
      '-n',
      clusterName,
      '-f',
      KUBECONFIG_LOCATION
   ]

   beforeEach(() => {
      jest.spyOn(Date, 'now').mockImplementation(() => date)
      jest.spyOn(exec, 'exec').mockImplementation(async () => 0)
      jest.spyOn(fs, 'chmodSync').mockImplementation()
      jest.spyOn(fs, 'writeFileSync').mockImplementation()
      jest.spyOn(core, 'exportVariable').mockImplementation()
      jest.spyOn(core, 'debug').mockImplementation()
      jest.spyOn(io, 'which').mockImplementation(async () => azPath)
      jest.spyOn(az, 'runAzCliCommand').mockImplementation(async () => {})
      jest
         .spyOn(az, 'runAzKubeconfigCommandBlocking')
         .mockImplementation(async () => kubeconfig)
   })

   it('throws an error if not given an azPath', async () => {
      jest.spyOn(io, 'which').mockImplementation(async () => '')
      jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
         if (inputName == 'admin') return 'true'
         if (inputName == 'subscription') return subscription
         if (inputName == 'cluster-name') return clusterName
         if (inputName == 'resource-group') return resourceGroup
         if (inputName == 'method') return Method.SERVICE_PRINCIPAL.toString()
         return ''
      })

      await expect(aks.getAKSKubeconfig()).rejects.toThrowError(
         'Az cli tools not installed. You must install them before running this action with an AKS cluster'
      )
   })

   it('gets the kubeconfig as an admin user with no subscription', async () => {
      jest.spyOn(io, 'which').mockImplementation(async () => azPath)
      jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
         if (inputName == 'resource-group') return resourceGroup
         if (inputName == 'cluster-name') return clusterName
         if (inputName == 'subscription') return ''
         if (inputName == 'admin') return 'true'
         if (inputName == 'method') return Method.SERVICE_PRINCIPAL.toString()
         return ''
      })
      jest.spyOn(fs, 'chmodSync')

      expect(await aks.getAKSKubeconfig()).toBe(kubeconfig)
      expect(az.runAzKubeconfigCommandBlocking).toHaveBeenCalledWith(
         azPath,
         cmd.concat(['--admin']),
         KUBECONFIG_LOCATION
      )
   })

   it('gets the kubeconfig as an admin user with a subscription', async () => {
      jest.spyOn(io, 'which').mockImplementation(async () => azPath)
      jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
         if (inputName == 'resource-group') return resourceGroup
         if (inputName == 'cluster-name') return clusterName
         if (inputName == 'subscription') return subscription
         if (inputName == 'admin') return 'true'
         if (inputName == 'method') return Method.SERVICE_PRINCIPAL.toString()
         return ''
      })
      jest.spyOn(fs, 'chmodSync')

      expect(await aks.getAKSKubeconfig()).toBe(kubeconfig)
      expect(az.runAzKubeconfigCommandBlocking).toHaveBeenCalledWith(
         azPath,
         cmd.concat(['--admin', '--subscription', subscription]),
         KUBECONFIG_LOCATION
      )
   })

   it('gets the kubeconfig as a non admin user with no subscription', async () => {
      jest.spyOn(utils, 'kubeLogin')
      jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
         if (inputName == 'adminInput') return 'false'
         if (inputName == 'subscription') return ''
         if (inputName == 'cluster-name') return clusterName
         if (inputName == 'resource-group') return resourceGroup
         if (inputName == 'method') return Method.SERVICE_PRINCIPAL.toString()
         return ''
      })

      const k = await aks.getAKSKubeconfig()
      expect(k).toBe(kubeconfig)

      expect(az.runAzKubeconfigCommandBlocking).toHaveBeenCalledWith(
         azPath,
         cmd,
         KUBECONFIG_LOCATION
      )

      expect(await utils.kubeLogin).toBeCalled()
      expect(await exec.exec).toHaveBeenCalledWith('kubelogin', [
         'convert-kubeconfig',
         '-l',
         'azurecli'
      ])
   })

   it('gets the kubeconfig as a non admin user with a subscription', async () => {
      jest.spyOn(utils, 'kubeLogin')
      jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
         if (inputName == 'adminInput') return 'false'
         if (inputName == 'subscription') return subscription
         if (inputName == 'cluster-name') return clusterName
         if (inputName == 'resource-group') return resourceGroup
         if (inputName == 'method') return Method.SERVICE_PRINCIPAL.toString()
         return ''
      })

      const k = await aks.getAKSKubeconfig()
      expect(k).toBe(kubeconfig)

      expect(az.runAzKubeconfigCommandBlocking).toHaveBeenCalledWith(
         azPath,
         cmd.concat(['--subscription', subscription]),
         KUBECONFIG_LOCATION
      )

      expect(await utils.kubeLogin).toBeCalled()
      expect(await exec.exec).toHaveBeenCalledWith('kubelogin', [
         'convert-kubeconfig',
         '-l',
         'azurecli'
      ])
   })

   it('fails when given a kubeconfig method with aks cluster', async () => {
      jest.spyOn(io, 'which').mockImplementation(async () => azPath)
      jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
         if (inputName == 'resource-group') return resourceGroup
         if (inputName == 'cluster-name') return clusterName
         if (inputName == 'subscription') return subscription
         if (inputName == 'admin') return 'true'
         if (inputName == 'method') return Method.KUBECONFIG.toString()
         return ''
      })

      await expect(aks.getAKSKubeconfig()).rejects.toThrowError(
         'Kubeconfig method not supported for AKS cluster'
      )
   })

   test('it gets kubeconfig through service-account', async () => {
      const k8sUrl = 'https://testing-dns-4za.hfp.earth.azmk8s.io:443'
      const token = 'ZXlKaGJHY2lPcUpTVXpJMU5pSX='
      const cert = 'LS0tLS1CRUdJTiBDRWyUSUZJQ'
      const k8sSecret: string = fs
         .readFileSync('tests/sample-secret.yml')
         .toString()

      jest.spyOn(core, 'getInput').mockImplementation((inputName: string) => {
         if (inputName == 'adminInput') return 'false'
         if (inputName == 'subscription') return subscription
         if (inputName == 'cluster-name') return clusterName
         if (inputName == 'resource-group') return resourceGroup
         if (inputName == 'method') return Method.SERVICE_ACCOUNT.toString()
         if (inputName == 'k8s-secret') return k8sSecret
         if (inputName == 'k8s-url') return k8sUrl
         return ''
      })

      const expectedConfig = JSON.stringify({
         apiVersion: 'v1',
         kind: 'Config',
         clusters: [
            {
               name: 'default',
               cluster: {
                  server: k8sUrl,
                  'certificate-authority-data': cert,
                  'insecure-skip-tls-verify': false
               }
            }
         ],
         users: [
            {
               name: 'default-user',
               user: {token: Buffer.from(token, 'base64').toString()}
            }
         ],
         contexts: [
            {
               name: 'loaded-context',
               context: {
                  cluster: 'default',
                  user: 'default-user',
                  name: 'loaded-context'
               }
            }
         ],
         preferences: {},
         'current-context': 'loaded-context'
      })

      expect(await aks.getAKSKubeconfig()).toBe(expectedConfig)
   })
})
