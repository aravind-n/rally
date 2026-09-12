// Ambiguous REST client — switches between mock and live via AMBIGUOUS_MODE env var.
// AMBIGUOUS_MODE=mock  → returns shaped fake data, no network calls
// AMBIGUOUS_MODE=live  → calls https://app.ambiguous.ai/api/<workspace>/ with bearer key
// AMBIGUOUS_WORKSPACE  → workspace slug, defaults to 'team-rocket'

const WORKSPACE = process.env.AMBIGUOUS_WORKSPACE ?? 'team-rocket';
const BASE = `https://app.ambiguous.ai/api/${WORKSPACE}`;

// Rally should use its own provisioned key (AMBIGUOUS_RALLY_KEY), falling back to admin key.
// The Rally identity is provisioned once via POST /api/admin/users/provision-agent.
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

// ── Tasks ────────────────────────────────────────────────────────────────────

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

// ── Docs ─────────────────────────────────────────────────────────────────────

export const docs = {
  async create(args: { title: string; content?: unknown }) {
    if (!isLive) return { id: `mock_doc_${Date.now()}`, url: '#' };
    return req<{ id: string; url: string }>('/documents', {
      method: 'POST',
      body: JSON.stringify(args),
    });
  },
};

// ── Calendar ─────────────────────────────────────────────────────────────────

export const calendar = {
  async getAvailability(args: { attendees: string[]; duration: number; window: string }) {
    if (!isLive) {
      // Mock: return a plausible slot
      return { slots: [{ start: 'tomorrow 2:30 PM', available: true }] };
    }
    return req<{ slots: { start: string; available: boolean }[] }>('/calendar/availability', {
      method: 'POST',
      body: JSON.stringify(args),
    });
  },

  async createEvent(args: { title: string; attendees: string[]; start: string; duration_minutes: number }) {
    if (!isLive) return { id: `mock_event_${Date.now()}`, url: '#' };
    return req<{ id: string; url: string }>('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(args),
    });
  },
};

// ── Mail ─────────────────────────────────────────────────────────────────────

export const mail = {
  async send(args: { to: string[]; subject: string; body: string }) {
    if (!isLive) return { id: `mock_msg_${Date.now()}`, url: '#' };
    return req<{ id: string; url: string }>('/messages', {
      method: 'POST',
      body: JSON.stringify(args),
    });
  },
};

// ── Chat ─────────────────────────────────────────────────────────────────────

export const chat = {
  async post(channel: string, text: string) {
    if (!isLive) return { id: `mock_chat_${Date.now()}` };
    return req<{ id: string }>(`/channels/${encodeURIComponent(channel)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
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
