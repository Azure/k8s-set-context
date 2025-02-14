import * as fs from 'fs'
import {getRequiredInputError} from '../../tests/util'
import {createKubeconfig, getDefaultKubeconfig} from './default'

describe('Default kubeconfig', () => {
   test('it creates a kubeconfig with proper format', () => {
      const certAuth = 'certAuth'
      const token = 'token'
      const clusterUrl = 'clusterUrl'

      const kc = createKubeconfig(certAuth, token, clusterUrl)
      const expected = JSON.stringify({
         apiVersion: 'v1',
         kind: 'Config',
         clusters: [
            {
               name: 'default',
               cluster: {
                  server: clusterUrl,
                  'certificate-authority-data': certAuth,
                  'insecure-skip-tls-verify': false
               }
            }
         ],
         users: [{name: 'default-user', user: {token}}],
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
      expect(kc).toBe(expected)
   })

   test('it throws error without method', () => {
      expect(() => getDefaultKubeconfig()).toThrow(
         getRequiredInputError('method')
      )
   })

   describe('default method', () => {
      beforeEach(() => {
         process.env['INPUT_METHOD'] = 'default'
      })

      test('it throws error without kubeconfig', () => {
         expect(() => getDefaultKubeconfig()).toThrow(
            getRequiredInputError('kubeconfig')
         )
      })

      test('it gets default config through kubeconfig input', () => {
         const kc = 'example kc'
         process.env['INPUT_KUBECONFIG'] = kc

         expect(getDefaultKubeconfig()).toBe(kc)
      })
   })

   test('it defaults to default method', () => {
      process.env['INPUT_METHOD'] = 'unknown'

      const kc = 'example kc'
      process.env['INPUT_KUBECONFIG'] = kc

      expect(getDefaultKubeconfig()).toBe(kc)
   })

   test('it defaults to default method from service-principal', () => {
      process.env['INPUT_METHOD'] = 'service-principal'

      const kc = 'example kc'
      process.env['INPUT_KUBECONFIG'] = kc

      expect(getDefaultKubeconfig()).toBe(kc)
   })

   describe('service-account method', () => {
      beforeEach(() => {
         process.env['INPUT_METHOD'] = 'service-account'
      })

      test('it throws error without cluster url', () => {
         expect(() => getDefaultKubeconfig()).toThrow(
            getRequiredInputError('k8s-url')
         )
      })

      test('it throws error without k8s secret', () => {
         process.env['INPUT_K8S-URL'] = 'url'

         expect(() => getDefaultKubeconfig()).toThrow(
            getRequiredInputError('k8s-secret')
         )
      })

      test('it responds with error if k8s-secret is not in yaml format', () => {
         process.env['INPUT_K8S-URL'] = 'url'
         process.env['INPUT_K8S-SECRET'] = 'simple string'

         expect(() => getDefaultKubeconfig()).toThrow(
            'k8s-secret is a string, when it should be YAML'
         )
      })

      test('it gets kubeconfig through service-account', () => {
         const k8sUrl = 'https://testing-dns-4za.hfp.earth.azmk8s.io:443'
         const token = 'ZXlKaGJHY2lPcUpTVXpJMU5pSX='
         const cert = 'LS0tLS1CRUdJTiBDRWyUSUZJQ'
         const k8sSecret = fs.readFileSync('tests/sample-secret.yml').toString()

         process.env['INPUT_K8S-URL'] = k8sUrl
         process.env['INPUT_K8S-SECRET'] = k8sSecret

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

         expect(getDefaultKubeconfig()).toBe(expectedConfig)
      })
   })
})
