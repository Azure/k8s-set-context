import {parseK8sSecret, K8sSecret} from './k8sSecret'

describe('K8sSecret type', () => {
   describe('Parsing from any', () => {
      test('it returns a type guarded secret', () => {
         const secret = {data: {token: 'token', 'ca.crt': 'cert'}}
         expect(() => parseK8sSecret(secret)).not.toThrow()
      })

      test('it throws an error when secret not provided', () => {
         expect(() => parseK8sSecret(undefined)).toThrow()
      })

      test('it throws an error when there is no data field', () => {
         const secret = {}
         expect(() => parseK8sSecret(secret)).toThrow()
      })

      test('it throws an error when there is no token', () => {
         const secret = {
            data: {
               'ca.crt': 'cert'
            }
         }
         expect(() => parseK8sSecret(secret)).toThrow()
      })

      test('it throws an error when there is no ca.crt field', () => {
         const secret = {data: {token: 'token'}}
         expect(() => parseK8sSecret(secret)).toThrow()
      })
   })
})
