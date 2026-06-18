/** @type {import('jest').Config} */
const ROOT = require('path').resolve(__dirname, '../../..')

module.exports = {
  testEnvironment: 'jsdom',
  rootDir: ROOT,
  roots: ['<rootDir>/qa-automation/tests/unit/frontend'],
  testMatch: ['**/*.test.{ts,tsx}'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          module: 'commonjs',
          moduleResolution: 'node',
          baseUrl: ROOT,
          paths: { '@/*': ['src/*'] },
          verbatimModuleSyntax: false,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/qa-automation/tests/unit/jest.setup.ts'],
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    'src/components/**/settingsValidation.ts',
    '!src/**/*.d.ts',
  ],
  coverageReporters: ['json-summary', 'lcov', 'text'],
  coverageDirectory: '<rootDir>/qa-automation/reports/output/coverage/frontend',
}
