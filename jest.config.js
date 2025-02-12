module.exports = {
   restoreMocks: true,
   clearMocks: true,
   resetMocks: true,
   moduleFileExtensions: ['js', 'ts'],
   testEnvironment: 'node',
   testMatch: ['**/*.test.ts'],
   transform: {
      '^.+\\.ts$': 'ts-jest'
   },
   transformIgnorePatterns: ['/node_modules/(?!@kubernetes/client-node/)'],
   moduleNameMapper: {
      '^@kubernetes/client-node$':
         '<rootDir>/node_modules/@kubernetes/client-node/dist/index.d.ts'
   },
   coverageThreshold: {
      global: {
         branches: 0,
         functions: 40,
         lines: 22,
         statements: 22
      }
   },
   verbose: true
}
