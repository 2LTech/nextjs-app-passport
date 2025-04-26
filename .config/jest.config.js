/** @type {import('jest').Config} */
const config = {
  silent: true,
  rootDir: '..',
  testEnvironment: 'node',
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
