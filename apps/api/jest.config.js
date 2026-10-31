module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@brightloop/shared-types$': '<rootDir>/../../packages/shared-types/src/index.ts',
    '^@brightloop/financial-core$': '<rootDir>/../../packages/financial-core/src/index.ts',
    '^@brightloop/validation$': '<rootDir>/../../packages/validation/src/index.ts',
  },
};
