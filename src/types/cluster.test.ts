import {Cluster, parseCluster} from './cluster'

describe('Cluster type', () => {
   test('it has required values', () => {
      const vals = <any>Object.values(Cluster)
      expect(vals.includes('arc')).toBe(true)
      expect(vals.includes('generic')).toBe(true)
   })

   test('it can parse valid values from a string', () => {
      expect(parseCluster('arc')).toBe(Cluster.ARC)
      expect(parseCluster('Arc')).toBe(Cluster.ARC)
      expect(parseCluster('ARC')).toBe(Cluster.ARC)

      expect(parseCluster('generic')).toBe(Cluster.GENERIC)
      expect(parseCluster('Generic')).toBe(Cluster.GENERIC)
      expect(parseCluster('GENERIC')).toBe(Cluster.GENERIC)
   })

   test("it will return undefined if it can't parse values from a string", () => {
      expect(parseCluster('invalid')).toBe(undefined)
      expect(parseCluster('unsupportedType')).toBe(undefined)
   })
})
