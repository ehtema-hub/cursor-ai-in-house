/** @type {import('jest').Config} */
const ROOT = require('path').resolve(__dirname, '../../..')
const FRONTEND = require('path').join(ROOT, 'frontend')

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
          baseUrl: FRONTEND,
          paths: { '@/*': ['src/*'] },
          verbatimModuleSyntax: false,
        },
        globals: {
          __API_BASE_URL__: '',
          __BLOG_API_BASE_URL__: '/blog-api',
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/qa-automation/tests/unit/jest.setup.ts'],
  collectCoverageFrom: [
    'frontend/src/lib/**/*.{ts,tsx}',
    'frontend/src/components/**/settingsValidation.ts',
    '!frontend/src/**/*.d.ts',
  ],
  coverageReporters: ['json-summary', 'lcov', 'text'],
  coverageDirectory: '<rootDir>/qa-automation/reports/output/coverage/frontend',
}
