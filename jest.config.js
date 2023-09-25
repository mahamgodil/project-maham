module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest'
  },
  // Enable coverage reporting
  collectCoverage: true,
  coverageReporters: ["json", "text", "lcov", "clover"],
  // Specify the directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  // Collect coverage only from metrics.ts
  collectCoverageFrom: ["metric.ts"]

};
