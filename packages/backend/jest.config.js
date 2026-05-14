module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@accessfix/shared$': '<rootDir>/../shared/src/index.ts',
  },
  testMatch: ['**/tests/**/*.test.ts'],
};
