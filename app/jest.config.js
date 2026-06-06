/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  watchman: false,
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '\\.(wav|mp3|aac)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.types.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
