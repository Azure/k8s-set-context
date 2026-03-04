import {defineConfig} from 'vitest/config'

export default defineConfig({
   test: {
      environment: 'node',
      include: ['**/*.test.ts'],
      restoreMocks: true,
      clearMocks: true,
      mockReset: true,
      coverage: {
         provider: 'v8',
         thresholds: {
            statements: 22,
            branches: 0,
            functions: 40,
            lines: 22
         }
      }
   }
})
