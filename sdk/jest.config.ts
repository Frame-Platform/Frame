import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest", // Ensures Jest understands TypeScript
  testEnvironment: "node", // Suitable for testing SDKs
  testMatch: ["**/tests/**/*.test.ts"], // Detects test files
  clearMocks: true, // Automatically clears mocks between tests
  transform: {
    "^.+\\.ts$": "ts-jest", // Transforms TypeScript files
  },
};

export default config;
