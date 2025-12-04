import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      USE_BEDROCK_MOCK: 'true',
      NODE_ENV: 'test',
    },
  },
});
