export default {
   restoreMocks: true,
   clearMocks: true,
   resetMocks: true,
   moduleFileExtensions: ['js', 'ts'],
   testEnvironment: 'node',
   testMatch: ['**/*.test.ts'],
   transform: {
      '^.+\\.ts$': 'ts-jest', // Use ts-jest for TypeScript files
      '^.+\\.js$': 'babel-jest' // Transform TypeScript files
   },
   transformIgnorePatterns: [
      '/node_modules/(?!@kubernetes/client-node)/' // Make sure to transform the Kubernetes client module
   ],
   moduleNameMapper: {
      '^.+\\.css$': 'jest-transform-stub' // Handle CSS imports (if any)
   },
   extensionsToTreatAsEsm: ['.ts', '.tsx'], // Treat TypeScript files as ESM
   verbose: true,
   coverageThreshold: {
      global: {
         branches: 0,
         functions: 40,
         lines: 22,
         statements: 22
      }
   }
}
