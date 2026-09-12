import type { NextConfig } from 'next';
import { existsSync } from 'fs';
import { resolve } from 'path';

const hasRealAgents = existsSync(resolve('node_modules/@openai/agents'));
const stub = resolve('src/lib/voice/openai-agents-realtime-stub.ts');

const config: NextConfig = {
  webpack(webpackConfig) {
    if (!hasRealAgents) {
      // Alias the missing package to our stub so the app compiles without @openai/agents.
      // On Aravind's machine the real package is present and this alias is never applied.
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@openai/agents/realtime': stub,
        '@openai/agents': stub,
      };
    }
    return webpackConfig;
  },
};

export default config;
