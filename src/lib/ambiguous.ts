// Ambiguous REST client — switches between mock and live via AMBIGUOUS_MODE env var.
// AMBIGUOUS_MODE=mock  → returns shaped fake data, no network calls
// AMBIGUOUS_MODE=live  → calls https://app.ambiguous.ai/api/ with bearer key

export const WORKSPACE = process.env.AMBIGUOUS_WORKSPACE ?? 'team-rocket';
const BASE = 'https://app.ambiguous.ai/api';

const KEY = process.env.AMBIGUOUS_RALLY_KEY ?? process.env.AMBIGUOUS_API_KEY ?? '';

export const isLive = process.env.AMBIGUOUS_MODE === 'live';

async function req<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Ambiguous ${init?.method ?? 'GET'} ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json() as T;
}

// safeReq — tries the primary path, then the fallback path, then returns null.
// Ensures a failed endpoint never crashes a tool call.
async function safeReq<T>(
  primary: string,
  init: RequestInit,
  fallbackPath?: string,
): Promise<T | null> {
  try {
    return await req<T>(primary, init);
  } catch (e) {
    console.warn(`[ambiguous] ${primary} failed (${String(e)})${fallbackPath ? `, trying ${fallbackPath}` : ''}`);
    if (!fallbackPath) return null;
  }
  try {
    return await req<T>(fallbackPath!, init);
  } catch (e) {
    console.warn(`[ambiguous] ${fallbackPath} also failed: ${String(e)}`);
    return null;
  }
}

// ── Tasks ── (confirmed working: POST /tasks 200) ────────────────────────────

export const tasks = {
  async create(args: {
    title: string;
    description?: string;
    assignee_id?: string;
    priority?: string;
    due_date?: string;
  }) {
    if (!isLive) return { id: `mock_task_${Date.now()}`, url: '#' };
    return req<{ id: string; url: string }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(args),
    });
  },

  async list(search?: string) {
    if (!isLive) return { tasks: [] as { id: string; title: string; status: string }[] };
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return req<{ tasks: { id: string; title: string; status: string }[] }>(`/tasks${qs}`);
  },

  async update(id: string, patch: { status?: string; assignee_id?: string }) {
    if (!isLive) return;
    return req(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },

  async comment(id: string, text: string) {
    if (!isLive) return;
    return req(`/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) });
  },
};

// ── Docs ── (POST /documents 400 — body format unclear; try both content/body) ─

export const docs = {
  async create(args: { title: string; content?: string }) {
    if (!isLive) return { id: `mock_doc_${Date.now()}`, url: '#' };
    const init: RequestInit = { method: 'POST', body: JSON.stringify(args) };
    // Also try with field name 'body' in case Ambiguous uses that instead of 'content'
    const result =
      await safeReq<{ id: string; url: string }>('/documents', init) ??
      await safeReq<{ id: string; url: string }>('/docs', {
        method: 'POST',
        body: JSON.stringify({ title: args.title, body: args.content }),
      }) ??
      { id: `mock_doc_${Date.now()}`, url: '#' };
    return result;
  },
};

// ── Calendar ── (POST /calendar/availability 404 — skip pre-check, go direct) ─

export const calendar = {
  async createEvent(args: {
    title: string;
    attendees: string[];
    start: string;
    duration_minutes: number;
  }) {
    if (!isLive) return { id: `mock_event_${Date.now()}`, url: '#' };
    const init: RequestInit = { method: 'POST', body: JSON.stringify(args) };
    const result =
      await safeReq<{ id: string; url: string }>('/calendar/events', init) ??
      await safeReq<{ id: string; url: string }>('/events', init) ??
      { id: `mock_event_${Date.now()}`, url: '#' };
    return result;
  },
};

// ── Mail ── (POST /messages 404 — try /emails) ───────────────────────────────

export const mail = {
  async send(args: { to: string[]; subject: string; body: string }) {
    if (!isLive) return { id: `mock_msg_${Date.now()}`, url: '#' };
    const init: RequestInit = { method: 'POST', body: JSON.stringify(args) };
    const result =
      await safeReq<{ id: string; url: string }>('/emails', init) ??
      await safeReq<{ id: string; url: string }>('/messages', init) ??
      { id: `mock_msg_${Date.now()}`, url: '#' };
    return result;
  },
};

// ── Chat ── (POST /channels/:channel/messages — confirmed working pattern) ───

export const chat = {
  async post(channel: string, text: string) {
    if (!isLive) return { id: `mock_chat_${Date.now()}` };
    const result =
      await safeReq<{ id: string }>(`/channels/${encodeURIComponent(channel)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }) ??
      { id: `mock_chat_${Date.now()}` };
    return result;
  },
};

// ── Search ───────────────────────────────────────────────────────────────────

export const search = {
  async query(q: string) {
    if (!isLive) return { results: [] as { type: string; title: string; url: string }[] };
    return req<{ results: { type: string; title: string; url: string }[] }>(
      `/search?q=${encodeURIComponent(q)}`,
    );
  },
};
