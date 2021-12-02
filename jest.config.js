module.exports = {
  restoreMocks: true,
  clearMocks: true,
  resetMocks: true,
  moduleFileExtensions: ["js", "ts"],
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  verbose: true,
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 40,
      lines: 22,
      statements: 22,
    },
  },
};
