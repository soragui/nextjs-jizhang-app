import type { Config } from "jest";

const commonConfig: Partial<Config> = {
  clearMocks: true,
  coverageDirectory: "coverage",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }],
  },
};

const config: Config = {
  ...commonConfig,
  projects: [
    {
      ...commonConfig,
      displayName: "dom",
      testMatch: ["**/__tests__/**/*.test.tsx"],
      testPathIgnorePatterns: [
        "<rootDir>/node_modules/",
        "<rootDir>/.next/",
        "<rootDir>/__tests__/api-.*\\.test\\.ts",
        "<rootDir>/__tests__/with-auth\\.test\\.ts",
      ],
      testEnvironment: "jsdom",
    },
    {
      ...commonConfig,
      displayName: "api",
      testMatch: ["**/__tests__/**/*.test.ts"],
      testEnvironment: "node",
      setupFilesAfterEnv: [], // No jest.setup.ts needed for API tests
    },
  ],
};

export default config;
