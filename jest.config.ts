import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts?(x)'],
  clearMocks: true,
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
}

export default createJestConfig(config)
