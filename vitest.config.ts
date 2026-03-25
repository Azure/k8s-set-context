import {defineConfig} from 'vitest/config'

export default defineConfig({
   test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.test.ts'],
      restoreMocks: true,
      clearMocks: true,
      coverage: {
         provider: 'v8',
         thresholds: {
            branches: 0,
            functions: 40,
            lines: 22,
            statements: 22
         }
      }
   }
})
