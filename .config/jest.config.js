/** @type {import('jest').Config} */
const config = {
  silent: true,
  rootDir: '..',
  testEnvironment: 'node',
  // `@/defs` now fails fast at module load when NEXTJS_APP_PASSPORT_TOKEN is
  // missing or shorter than 32 chars, so provide a valid default secret before
  // any test file loads. Tests that exercise the validation itself override or
  // delete the variable around their own dynamic imports.
  setupFiles: ['<rootDir>/.config/jest.setup.js'],
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*'],
  transform: {
    '^.+\\.(j|t)s': [
      'babel-jest',
      {
        presets: ['@babel/preset-env', '@babel/preset-typescript']
      }
    ]
  },
  moduleNameMapper: {
    '^@/(.*)$': ['<rootDir>/src/$1']
  }
}

module.exports = config
