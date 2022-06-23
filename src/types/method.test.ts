import {Method, parseMethod} from './method'

describe('Method type', () => {
   test('it has required values', () => {
      const vals = <any>Object.values(Method)
      expect(vals.includes('kubeconfig')).toBe(true)
      expect(vals.includes('service-account')).toBe(true)
      expect(vals.includes('service-principal')).toBe(true)
   })

   test('it can parse valid values from a string', () => {
      expect(parseMethod('kubeconfig')).toBe(Method.KUBECONFIG)
      expect(parseMethod('Kubeconfig')).toBe(Method.KUBECONFIG)
      expect(parseMethod('KUBECONFIG')).toBe(Method.KUBECONFIG)

      expect(parseMethod('service-account')).toBe(Method.SERVICE_ACCOUNT)
      expect(parseMethod('Service-Account')).toBe(Method.SERVICE_ACCOUNT)
      expect(parseMethod('SERVICE-ACCOUNT')).toBe(Method.SERVICE_ACCOUNT)

      expect(parseMethod('service-principal')).toBe(Method.SERVICE_PRINCIPAL)
      expect(parseMethod('Service-Principal')).toBe(Method.SERVICE_PRINCIPAL)
      expect(parseMethod('SERVICE-PRINCIPAL')).toBe(Method.SERVICE_PRINCIPAL)
   })

   test("it will return undefined if it can't parse values from a string", () => {
      expect(parseMethod('invalid')).toBe(undefined)
      expect(parseMethod('unsupportedType')).toBe(undefined)
   })
})
