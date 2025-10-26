export default {
  testTimeout: 10000,
  bail: 1,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(supertest)/)'
  ]
}