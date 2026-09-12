const CLIENT_SECRET_URL = 'https://api.openai.com/v1/realtime/client_secrets';
const REALTIME_MODEL = 'gpt-realtime-2.1';

export const dynamic = 'force-dynamic';

export async function POST() {
  const credential = process.env.OPENAI_API_KEY ?? process.env.OPENAI_ACCESS_TOKEN;

  if (!credential) {
    return Response.json(
      {
        error:
          'Missing OPENAI_API_KEY or workload-identity OPENAI_ACCESS_TOKEN. Use ?sim=1 without credentials.',
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(CLIENT_SECRET_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credential}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: REALTIME_MODEL,
          audio: { output: { voice: 'marin' } },
        },
      }),
      cache: 'no-store',
    });

    const body = await response.json();
    return Response.json(body, { status: response.status });
  } catch (error) {
    return Response.json(
      { error: 'Failed to mint a Realtime client secret.', detail: String(error) },
      { status: 502 },
    );
  }
}
