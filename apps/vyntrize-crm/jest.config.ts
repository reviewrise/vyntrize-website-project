import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@platform/vyntrize-db$':
      '<rootDir>/../../packages/@platform/vyntrize-db/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // Relax settings for tests
          strict: false,
          esModuleInterop: true,
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Don't try to collect coverage from Next.js internals
  collectCoverageFrom: ['lib/**/*.ts', '!lib/**/*.d.ts'],
};

export default config;
