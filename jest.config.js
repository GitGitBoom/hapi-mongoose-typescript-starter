module.exports = {
  testEnvironment: 'node',
  globalSetup: './__tests__/_setup/setup.ts',
  globalTeardown: './__tests__/_setup/teardown.ts',
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
};