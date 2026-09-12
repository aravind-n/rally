import { createOpenAI } from '@ai-sdk/openai';
import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from '@copilotkit/runtime/v2';

export const runtime = 'nodejs';

type RuntimeHandler = (request: Request) => Promise<Response>;

let cachedConfig = '';
let cachedHandler: RuntimeHandler | null = null;

function normalizeBaseUrl(endpoint: string): string {
  const base = endpoint.replace(/\/+$/, '');
  return base.endsWith('/v1') ? base : `${base}/v1`;
}

function getHandler(endpoint: string, apiKey: string): RuntimeHandler {
  const config = `${endpoint}\0${apiKey}`;
  if (cachedHandler && cachedConfig === config) return cachedHandler;

  const hermes = createOpenAI({
    name: 'hermes',
    baseURL: normalizeBaseUrl(endpoint),
    apiKey,
  });
  const agent = new BuiltInAgent({
    model: hermes.chat('hermes-agent'),
    maxSteps: 3,
    prompt: [
      'You are Rally\'s slow brain for meeting memory, research, and delegation.',
      'Use the meeting context the client supplies and answer concisely.',
      'Never claim that an external action succeeded unless its tool result confirms it.',
    ].join(' '),
  });
  const copilotRuntime = new CopilotRuntime({ agents: { default: agent } });

  cachedConfig = config;
  cachedHandler = createCopilotRuntimeHandler({
    runtime: copilotRuntime,
    basePath: '/api/copilotkit',
    mode: 'single-route',
  });
  return cachedHandler;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.HERMES_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {
        error:
          'Hermes is not configured. Set HERMES_API_KEY after starting the local OAuth-backed gateway.',
      },
      { status: 503 },
    );
  }

  const endpoint =
    process.env.HERMES_ENDPOINT?.trim() || 'http://127.0.0.1:8642';
  return getHandler(endpoint, apiKey)(request);
}
